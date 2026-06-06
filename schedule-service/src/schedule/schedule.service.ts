import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleInput, ScheduleFilterInput, Schedule, SchedulesResponse } from './dto';
import { PaginationInput } from '../common/dto/pagination.input';

const CACHE_TTL = 60 * 1000; // 60 seconds
const CACHE_PREFIX = 'schedule:';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('email-queue') private emailQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(input: CreateScheduleInput) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: input.customerId },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: input.doctorId },
    });

    if (!doctor) {
      throw new BadRequestException('Doctor not found');
    }

    const scheduledAt = new Date(input.scheduledAt);
    const scheduledEnd = new Date(scheduledAt.getTime() + input.duration * 60000);

    const conflictingSchedule = await this.prisma.schedule.findFirst({
      where: {
        doctorId: input.doctorId,
        AND: [
          {
            scheduledAt: {
              lt: scheduledEnd,
            },
          },
          {
            OR: [
              {
                scheduledAt: {
                  gte: scheduledAt,
                },
              },
              {
                AND: [
                  {
                    scheduledAt: {
                      lt: scheduledAt,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    if (conflictingSchedule) {
      const conflictEnd = new Date(
        conflictingSchedule.scheduledAt.getTime() +
          conflictingSchedule.duration * 60000,
      );

      if (scheduledAt < conflictEnd && scheduledEnd > conflictingSchedule.scheduledAt) {
        throw new ConflictException(
          `Doctor already has a schedule at this time (${conflictingSchedule.scheduledAt.toISOString()})`,
        );
      }
    }

    const schedule = await this.prisma.schedule.create({
      data: {
        objective: input.objective,
        customerId: input.customerId,
        doctorId: input.doctorId,
        scheduledAt,
        duration: input.duration,
      },
      include: {
        customer: true,
        doctor: true,
      },
    });

    await this.emailQueue.add('schedule-created', {
      customerEmail: customer.email,
      customerName: customer.name,
      doctorName: doctor.name,
      objective: input.objective,
      scheduledAt: scheduledAt.toISOString(),
      duration: input.duration,
    });

    this.logger.log({
      msg: 'Schedule created, email job added to queue',
      scheduleId: schedule.id,
      customerEmail: customer.email,
    });

    return schedule;
  }

  async findAll(pagination: PaginationInput, filter?: ScheduleFilterInput) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filter?.customerId) {
      where.customerId = filter.customerId;
    }

    if (filter?.doctorId) {
      where.doctorId = filter.doctorId;
    }

    if (filter?.dateFrom || filter?.dateTo) {
      where.scheduledAt = {};
      if (filter.dateFrom) {
        where.scheduledAt.gte = new Date(filter.dateFrom);
      }
      if (filter.dateTo) {
        where.scheduledAt.lte = new Date(filter.dateTo);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.schedule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: {
          customer: true,
          doctor: true,
        },
      }),
      this.prisma.schedule.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Schedule> {
    const cacheKey = `${CACHE_PREFIX}${id}`;

    const cached = await this.cacheManager.get<Schedule>(cacheKey);
    if (cached) {
      return cached;
    }

    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        customer: true,
        doctor: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    await this.cacheManager.set(cacheKey, schedule, CACHE_TTL);
    return schedule;
  }

  async remove(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        customer: true,
        doctor: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    await this.prisma.schedule.delete({
      where: { id },
    });

    await this.cacheManager.del(`${CACHE_PREFIX}${id}`);

    await this.emailQueue.add('schedule-deleted', {
      customerEmail: schedule.customer.email,
      customerName: schedule.customer.name,
      doctorName: schedule.doctor.name,
      objective: schedule.objective,
      scheduledAt: schedule.scheduledAt.toISOString(),
    });

    this.logger.log({
      msg: 'Schedule deleted, email job added to queue',
      scheduleId: id,
      customerEmail: schedule.customer.email,
    });

    return true;
  }
}

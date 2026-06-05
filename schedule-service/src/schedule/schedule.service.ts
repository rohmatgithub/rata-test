import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleInput, ScheduleFilterInput } from './dto';
import { PaginationInput } from '../common/dto/pagination.input';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.schedule.create({
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

  async findOne(id: string) {
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

    return schedule;
  }

  async remove(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    await this.prisma.schedule.delete({
      where: { id },
    });

    return true;
  }
}

import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorInput, UpdateDoctorInput, Doctor, DoctorsResponse } from './dto';
import { PaginationInput } from '../common/dto/pagination.input';

const CACHE_TTL = 60 * 1000; // 60 seconds
const CACHE_PREFIX = 'doctor:';

@Injectable()
export class DoctorService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async clearListCache(): Promise<void> {
    const pagesToClear = [1, 2, 3, 4, 5];
    const limitsToClear = [10, 20, 50];

    const deletePromises: Promise<unknown>[] = [];
    for (const page of pagesToClear) {
      for (const limit of limitsToClear) {
        deletePromises.push(
          this.cacheManager.del(`${CACHE_PREFIX}list:${page}:${limit}`)
        );
      }
    }
    await Promise.all(deletePromises);
  }

  async create(input: CreateDoctorInput): Promise<Doctor> {
    const doctor = await this.prisma.doctor.create({
      data: input,
    });

    await this.clearListCache();
    return doctor;
  }

  async findAll(pagination: PaginationInput): Promise<DoctorsResponse> {
    const { page = 1, limit = 10 } = pagination;
    const cacheKey = `${CACHE_PREFIX}list:${page}:${limit}`;

    const cached = await this.cacheManager.get<DoctorsResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.doctor.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.doctor.count(),
    ]);

    const result: DoctorsResponse = {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await this.cacheManager.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async findOne(id: string): Promise<Doctor> {
    const cacheKey = `${CACHE_PREFIX}${id}`;

    const cached = await this.cacheManager.get<Doctor>(cacheKey);
    if (cached) {
      return cached;
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    await this.cacheManager.set(cacheKey, doctor, CACHE_TTL);
    return doctor;
  }

  async update(input: UpdateDoctorInput): Promise<Doctor> {
    const { id, ...data } = input;

    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const updated = await this.prisma.doctor.update({
      where: { id },
      data,
    });

    await this.cacheManager.del(`${CACHE_PREFIX}${id}`);
    await this.clearListCache();
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    await this.prisma.doctor.delete({
      where: { id },
    });

    await this.cacheManager.del(`${CACHE_PREFIX}${id}`);
    await this.clearListCache();
    return true;
  }
}

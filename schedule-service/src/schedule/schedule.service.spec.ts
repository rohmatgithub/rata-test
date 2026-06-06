import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ScheduleService } from './schedule.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    customer: {
      findUnique: jest.fn(),
    },
    doctor: {
      findUnique: jest.fn(),
    },
    schedule: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockEmailQueue = {
    add: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: getQueueToken('email-queue'), useValue: mockEmailQueue },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  const mockCustomer = {
    id: 'customer-id',
    name: 'John Doe',
    email: 'john@example.com',
  };

  const mockDoctor = {
    id: 'doctor-id',
    name: 'Dr. Smith',
  };

  const mockSchedule = {
    id: 'schedule-id',
    objective: 'Checkup',
    customerId: 'customer-id',
    doctorId: 'doctor-id',
    scheduledAt: new Date('2026-06-10T10:00:00Z'),
    duration: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: mockCustomer,
    doctor: mockDoctor,
  };

  describe('create', () => {
    const createInput = {
      objective: 'Checkup',
      customerId: 'customer-id',
      doctorId: 'doctor-id',
      scheduledAt: '2026-06-10T10:00:00Z',
      duration: 30,
    };

    it('should create a schedule successfully', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.doctor.findUnique.mockResolvedValue(mockDoctor);
      mockPrismaService.schedule.findFirst.mockResolvedValue(null);
      mockPrismaService.schedule.create.mockResolvedValue(mockSchedule);

      const result = await service.create(createInput);

      expect(result).toEqual(mockSchedule);
      expect(mockEmailQueue.add).toHaveBeenCalledWith(
        'schedule-created',
        expect.objectContaining({
          customerEmail: mockCustomer.email,
          customerName: mockCustomer.name,
          doctorName: mockDoctor.name,
        }),
      );
    });

    it('should throw BadRequestException if customer not found', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(service.create(createInput)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if doctor not found', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.doctor.findUnique.mockResolvedValue(null);

      await expect(service.create(createInput)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if schedule conflicts', async () => {
      const conflictingSchedule = {
        ...mockSchedule,
        scheduledAt: new Date('2026-06-10T10:00:00Z'),
      };

      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.doctor.findUnique.mockResolvedValue(mockDoctor);
      mockPrismaService.schedule.findFirst.mockResolvedValue(conflictingSchedule);

      await expect(service.create(createInput)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated schedules', async () => {
      const schedules = [mockSchedule];
      mockPrismaService.schedule.findMany.mockResolvedValue(schedules);
      mockPrismaService.schedule.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(schedules);
      expect(result.total).toBe(1);
    });

    it('should filter by customerId', async () => {
      mockPrismaService.schedule.findMany.mockResolvedValue([]);
      mockPrismaService.schedule.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10 }, { customerId: 'customer-id' });

      expect(mockPrismaService.schedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 'customer-id' }),
        }),
      );
    });

    it('should filter by doctorId', async () => {
      mockPrismaService.schedule.findMany.mockResolvedValue([]);
      mockPrismaService.schedule.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10 }, { doctorId: 'doctor-id' });

      expect(mockPrismaService.schedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ doctorId: 'doctor-id' }),
        }),
      );
    });

    it('should filter by date range', async () => {
      mockPrismaService.schedule.findMany.mockResolvedValue([]);
      mockPrismaService.schedule.count.mockResolvedValue(0);

      await service.findAll(
        { page: 1, limit: 10 },
        { dateFrom: '2026-06-01', dateTo: '2026-06-30' },
      );

      expect(mockPrismaService.schedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            scheduledAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a schedule by id', async () => {
      mockPrismaService.schedule.findUnique.mockResolvedValue(mockSchedule);

      const result = await service.findOne('schedule-id');

      expect(result).toEqual(mockSchedule);
    });

    it('should throw NotFoundException if schedule not found', async () => {
      mockPrismaService.schedule.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a schedule successfully', async () => {
      mockPrismaService.schedule.findUnique.mockResolvedValue(mockSchedule);
      mockPrismaService.schedule.delete.mockResolvedValue(mockSchedule);

      const result = await service.remove('schedule-id');

      expect(result).toBe(true);
      expect(mockEmailQueue.add).toHaveBeenCalledWith(
        'schedule-deleted',
        expect.objectContaining({
          customerEmail: mockCustomer.email,
          customerName: mockCustomer.name,
        }),
      );
    });

    it('should throw NotFoundException if schedule not found', async () => {
      mockPrismaService.schedule.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

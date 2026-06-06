import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DoctorService } from './doctor.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DoctorService', () => {
  let service: DoctorService;

  const mockPrismaService = {
    doctor: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockCacheManager = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module = (await Test.createTestingModule({
      providers: [
        DoctorService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile()) as any;

    service = module.get(DoctorService);

    jest.clearAllMocks();
  });

  const mockDoctor = {
    id: 'doctor-id',
    name: 'Dr. Smith',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    const createInput = { name: 'Dr. Smith' };

    it('should create a doctor successfully', async () => {
      mockPrismaService.doctor.create.mockResolvedValue(mockDoctor);

      const result = await service.create(createInput);

      expect(result).toEqual(mockDoctor);
      expect(mockPrismaService.doctor.create).toHaveBeenCalledWith({
        data: createInput,
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated doctors', async () => {
      const doctors = [mockDoctor];
      mockPrismaService.doctor.findMany.mockResolvedValue(doctors);
      mockPrismaService.doctor.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(doctors);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should calculate correct totalPages', async () => {
      mockPrismaService.doctor.findMany.mockResolvedValue([]);
      mockPrismaService.doctor.count.mockResolvedValue(25);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.totalPages).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should return a doctor by id', async () => {
      mockPrismaService.doctor.findUnique.mockResolvedValue(mockDoctor);

      const result = await service.findOne('doctor-id');

      expect(result).toEqual(mockDoctor);
    });

    it('should throw NotFoundException if doctor not found', async () => {
      mockPrismaService.doctor.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a doctor successfully', async () => {
      const updateInput = { id: 'doctor-id', name: 'Dr. Johnson' };
      const updatedDoctor = { ...mockDoctor, name: 'Dr. Johnson' };
      mockPrismaService.doctor.findUnique.mockResolvedValue(mockDoctor);
      mockPrismaService.doctor.update.mockResolvedValue(updatedDoctor);

      const result = await service.update(updateInput);

      expect(result.name).toBe('Dr. Johnson');
    });

    it('should throw NotFoundException if doctor not found', async () => {
      const updateInput = { id: 'non-existent-id', name: 'Dr. Johnson' };
      mockPrismaService.doctor.findUnique.mockResolvedValue(null);

      await expect(service.update(updateInput)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a doctor successfully', async () => {
      mockPrismaService.doctor.findUnique.mockResolvedValue(mockDoctor);
      mockPrismaService.doctor.delete.mockResolvedValue(mockDoctor);

      const result = await service.remove('doctor-id');

      expect(result).toBe(true);
    });

    it('should throw NotFoundException if doctor not found', async () => {
      mockPrismaService.doctor.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

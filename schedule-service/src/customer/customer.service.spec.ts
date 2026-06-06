import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CustomerService } from './customer.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CustomerService', () => {
  let service: CustomerService;

  const mockPrismaService = {
    customer: {
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
        CustomerService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile()) as any;

    service = module.get(CustomerService);

    jest.clearAllMocks();
  });

  const mockCustomer = {
    id: 'customer-id',
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    const createInput = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    it('should create a customer successfully', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);
      mockPrismaService.customer.create.mockResolvedValue(mockCustomer);

      const result = await service.create(createInput);

      expect(result).toEqual(mockCustomer);
      expect(mockPrismaService.customer.create).toHaveBeenCalledWith({
        data: createInput,
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);

      await expect(service.create(createInput)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const customers = [mockCustomer];
      mockPrismaService.customer.findMany.mockResolvedValue(customers);
      mockPrismaService.customer.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(customers);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should use default pagination values', async () => {
      mockPrismaService.customer.findMany.mockResolvedValue([]);
      mockPrismaService.customer.count.mockResolvedValue(0);

      await service.findAll({});

      expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);

      const result = await service.findOne('customer-id');

      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException if customer not found', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a customer successfully', async () => {
      const updateInput = { id: 'customer-id', name: 'Jane Doe' };
      const updatedCustomer = { ...mockCustomer, name: 'Jane Doe' };
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.customer.update.mockResolvedValue(updatedCustomer);

      const result = await service.update(updateInput);

      expect(result.name).toBe('Jane Doe');
    });

    it('should throw NotFoundException if customer not found', async () => {
      const updateInput = { id: 'non-existent-id', name: 'Jane Doe' };
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(service.update(updateInput)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if email already taken', async () => {
      const updateInput = { id: 'customer-id', email: 'taken@example.com' };
      mockPrismaService.customer.findUnique
        .mockResolvedValueOnce(mockCustomer)
        .mockResolvedValueOnce({ id: 'other-customer', email: 'taken@example.com' });

      await expect(service.update(updateInput)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a customer successfully', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.customer.delete.mockResolvedValue(mockCustomer);

      const result = await service.remove('customer-id');

      expect(result).toBe(true);
    });

    it('should throw NotFoundException if customer not found', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

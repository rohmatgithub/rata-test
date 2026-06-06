import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerInput, UpdateCustomerInput, Customer, CustomersResponse } from './dto';
import { PaginationInput } from '../common/dto/pagination.input';

const CACHE_TTL = 60 * 1000; // 60 seconds
const CACHE_PREFIX = 'customer:';

@Injectable()
export class CustomerService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(input: CreateCustomerInput): Promise<Customer> {
    const existing = await this.prisma.customer.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictException('Customer with this email already exists');
    }

    return this.prisma.customer.create({
      data: input,
    });
  }

  async findAll(pagination: PaginationInput): Promise<CustomersResponse> {
    const { page = 1, limit = 10 } = pagination;
    const cacheKey = `${CACHE_PREFIX}list:${page}:${limit}`;

    const cached = await this.cacheManager.get<CustomersResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count(),
    ]);

    const result: CustomersResponse = {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await this.cacheManager.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async findOne(id: string): Promise<Customer> {
    const cacheKey = `${CACHE_PREFIX}${id}`;

    const cached = await this.cacheManager.get<Customer>(cacheKey);
    if (cached) {
      return cached;
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.cacheManager.set(cacheKey, customer, CACHE_TTL);
    return customer;
  }

  async update(input: UpdateCustomerInput): Promise<Customer> {
    const { id, ...data } = input;

    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (data.email && data.email !== customer.email) {
      const existing = await this.prisma.customer.findUnique({
        where: { email: data.email },
      });

      if (existing) {
        throw new ConflictException('Customer with this email already exists');
      }
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data,
    });

    await this.cacheManager.del(`${CACHE_PREFIX}${id}`);
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.prisma.customer.delete({
      where: { id },
    });

    await this.cacheManager.del(`${CACHE_PREFIX}${id}`);
    return true;
  }
}

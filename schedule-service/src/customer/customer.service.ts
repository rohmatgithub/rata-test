import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerInput, UpdateCustomerInput } from './dto';
import { PaginationInput } from '../common/dto/pagination.input';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateCustomerInput) {
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

  async findAll(pagination: PaginationInput) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count(),
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
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(input: UpdateCustomerInput) {
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

    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.prisma.customer.delete({
      where: { id },
    });

    return true;
  }
}

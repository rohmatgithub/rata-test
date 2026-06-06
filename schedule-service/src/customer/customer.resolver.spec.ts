import { Test, TestingModule } from '@nestjs/testing';
import { CustomerResolver } from './customer.resolver';
import { CustomerService } from './customer.service';
import { AuthGuard } from '../common/guards/auth.guard';

describe('CustomerResolver', () => {
  let resolver: CustomerResolver;
  let customerService: CustomerService;

  const mockCustomerService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerResolver,
        { provide: CustomerService, useValue: mockCustomerService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<CustomerResolver>(CustomerResolver);
    customerService = module.get<CustomerService>(CustomerService);

    jest.clearAllMocks();
  });

  const mockCustomer = {
    id: 'customer-id',
    name: 'John Doe',
    email: 'john@example.com',
  };

  describe('createCustomer', () => {
    it('should create a customer', async () => {
      const input = { name: 'John Doe', email: 'john@example.com' };
      mockCustomerService.create.mockResolvedValue(mockCustomer);

      const result = await resolver.createCustomer(input);

      expect(result).toEqual(mockCustomer);
      expect(mockCustomerService.create).toHaveBeenCalledWith(input);
    });
  });

  describe('customers', () => {
    it('should return paginated customers', async () => {
      const expectedResult = {
        data: [mockCustomer],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockCustomerService.findAll.mockResolvedValue(expectedResult);

      const result = await resolver.customers({ page: 1, limit: 10 });

      expect(result).toEqual(expectedResult);
    });
  });

  describe('customer', () => {
    it('should return a customer by id', async () => {
      mockCustomerService.findOne.mockResolvedValue(mockCustomer);

      const result = await resolver.customer('customer-id');

      expect(result).toEqual(mockCustomer);
    });
  });

  describe('updateCustomer', () => {
    it('should update a customer', async () => {
      const input = { id: 'customer-id', name: 'Jane Doe' };
      const updatedCustomer = { ...mockCustomer, name: 'Jane Doe' };
      mockCustomerService.update.mockResolvedValue(updatedCustomer);

      const result = await resolver.updateCustomer(input);

      expect(result).toEqual(updatedCustomer);
    });
  });

  describe('deleteCustomer', () => {
    it('should delete a customer', async () => {
      mockCustomerService.remove.mockResolvedValue(true);

      const result = await resolver.deleteCustomer('customer-id');

      expect(result).toBe(true);
    });
  });
});

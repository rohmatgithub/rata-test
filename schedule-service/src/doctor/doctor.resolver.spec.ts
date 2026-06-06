import { Test, TestingModule } from '@nestjs/testing';
import { DoctorResolver } from './doctor.resolver';
import { DoctorService } from './doctor.service';
import { AuthGuard } from '../common/guards/auth.guard';

describe('DoctorResolver', () => {
  let resolver: DoctorResolver;
  let doctorService: DoctorService;

  const mockDoctorService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorResolver,
        { provide: DoctorService, useValue: mockDoctorService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<DoctorResolver>(DoctorResolver);
    doctorService = module.get<DoctorService>(DoctorService);

    jest.clearAllMocks();
  });

  const mockDoctor = {
    id: 'doctor-id',
    name: 'Dr. Smith',
    specialization: 'Cardiology',
  };

  describe('createDoctor', () => {
    it('should create a doctor', async () => {
      const input = { name: 'Dr. Smith', specialization: 'Cardiology' };
      mockDoctorService.create.mockResolvedValue(mockDoctor);

      const result = await resolver.createDoctor(input);

      expect(result).toEqual(mockDoctor);
      expect(mockDoctorService.create).toHaveBeenCalledWith(input);
    });
  });

  describe('doctors', () => {
    it('should return paginated doctors', async () => {
      const expectedResult = {
        data: [mockDoctor],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockDoctorService.findAll.mockResolvedValue(expectedResult);

      const result = await resolver.doctors({ page: 1, limit: 10 });

      expect(result).toEqual(expectedResult);
    });
  });

  describe('doctor', () => {
    it('should return a doctor by id', async () => {
      mockDoctorService.findOne.mockResolvedValue(mockDoctor);

      const result = await resolver.doctor('doctor-id');

      expect(result).toEqual(mockDoctor);
    });
  });

  describe('updateDoctor', () => {
    it('should update a doctor', async () => {
      const input = { id: 'doctor-id', name: 'Dr. Johnson' };
      const updatedDoctor = { ...mockDoctor, name: 'Dr. Johnson' };
      mockDoctorService.update.mockResolvedValue(updatedDoctor);

      const result = await resolver.updateDoctor(input);

      expect(result).toEqual(updatedDoctor);
    });
  });

  describe('deleteDoctor', () => {
    it('should delete a doctor', async () => {
      mockDoctorService.remove.mockResolvedValue(true);

      const result = await resolver.deleteDoctor('doctor-id');

      expect(result).toBe(true);
    });
  });
});

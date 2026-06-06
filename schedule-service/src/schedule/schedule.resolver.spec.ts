import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleResolver } from './schedule.resolver';
import { ScheduleService } from './schedule.service';
import { AuthGuard } from '../common/guards/auth.guard';

describe('ScheduleResolver', () => {
  let resolver: ScheduleResolver;
  let scheduleService: ScheduleService;

  const mockScheduleService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleResolver,
        { provide: ScheduleService, useValue: mockScheduleService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<ScheduleResolver>(ScheduleResolver);
    scheduleService = module.get<ScheduleService>(ScheduleService);

    jest.clearAllMocks();
  });

  const mockSchedule = {
    id: 'schedule-id',
    customerId: 'customer-id',
    doctorId: 'doctor-id',
    objective: 'Checkup',
    scheduledAt: new Date('2026-06-10T10:00:00Z'),
    duration: 30,
    status: 'SCHEDULED',
  };

  describe('createSchedule', () => {
    it('should create a schedule', async () => {
      const input = {
        customerId: 'customer-id',
        doctorId: 'doctor-id',
        objective: 'Checkup',
        scheduledAt: new Date('2026-06-10T10:00:00Z'),
        duration: 30,
      };
      mockScheduleService.create.mockResolvedValue(mockSchedule);

      const result = await resolver.createSchedule(input);

      expect(result).toEqual(mockSchedule);
      expect(mockScheduleService.create).toHaveBeenCalledWith(input);
    });
  });

  describe('schedules', () => {
    it('should return paginated schedules', async () => {
      const expectedResult = {
        data: [mockSchedule],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockScheduleService.findAll.mockResolvedValue(expectedResult);

      const result = await resolver.schedules({ page: 1, limit: 10 });

      expect(result).toEqual(expectedResult);
    });
  });

  describe('schedule', () => {
    it('should return a schedule by id', async () => {
      mockScheduleService.findOne.mockResolvedValue(mockSchedule);

      const result = await resolver.schedule('schedule-id');

      expect(result).toEqual(mockSchedule);
    });
  });

  describe('deleteSchedule', () => {
    it('should delete a schedule', async () => {
      mockScheduleService.remove.mockResolvedValue(true);

      const result = await resolver.deleteSchedule('schedule-id');

      expect(result).toBe(true);
    });
  });
});

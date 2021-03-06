import AppError from '@shared/errors/AppError';

import FakeAppointmentsRepository from '@modules/appointments/repositories/fakes/FakeAppointmentsRepository';
import FakeNotificationsRepository from '@modules/notifications/repositories/fakes/FakeNotificationsRepository';
import FakeCacheProvider from '@shared/container/providers/CacheProvider/fakes/FakeCacheProvider';
import CreateAppointmentService from './CreateAppointmentService';

let fakeAppointmentsRepository: FakeAppointmentsRepository;
let fakeNotificationsRepository: FakeNotificationsRepository;
let fakeCacheProvider: FakeCacheProvider;
let createAppointment: CreateAppointmentService;

describe('CreateAppointment', () => {
  beforeEach(() => {
    fakeAppointmentsRepository = new FakeAppointmentsRepository();
    fakeNotificationsRepository = new FakeNotificationsRepository();
    fakeCacheProvider = new FakeCacheProvider();
    createAppointment = new CreateAppointmentService(
      fakeAppointmentsRepository,
      fakeNotificationsRepository,
      fakeCacheProvider,
    );
  });

  it('should be able to create a new appointment', async () => {
    jest
      .spyOn(Date, 'now')
      .mockImplementationOnce(() => new Date(2021, 0, 10, 12).getTime());

    const appointment = await createAppointment.execute({
      date: new Date(2021, 0, 10, 13),
      provider_id: '123123123',
      user_id: '123456789',
    });

    expect(appointment).toHaveProperty('id');
    expect(appointment.provider_id).toBe('123123123');
  });

  it('should not be able to create two appointments on the same schedule', async () => {
    const appointmentDate = new Date(2021, 0, 10, 14);

    jest
      .spyOn(Date, 'now')
      .mockImplementationOnce(() => new Date(2021, 0, 10, 12).getTime());

    await createAppointment.execute({
      date: appointmentDate,
      provider_id: '123123123',
      user_id: '123456789',
    });

    jest
      .spyOn(Date, 'now')
      .mockImplementationOnce(() => new Date(2021, 0, 10, 12).getTime());

    await expect(
      createAppointment.execute({
        date: appointmentDate,
        provider_id: '123123123',
        user_id: '123456789',
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('should not be able to create an appointment on a past date', async () => {
    jest
      .spyOn(Date, 'now')
      .mockImplementationOnce(() => new Date(2021, 0, 10, 12).getTime());

    await expect(
      createAppointment.execute({
        date: new Date(2021, 0, 10, 11),
        provider_id: '123123123',
        user_id: '123456789',
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('should not be able to create an appointment with same user as provider', async () => {
    jest
      .spyOn(Date, 'now')
      .mockImplementationOnce(() => new Date(2021, 0, 10, 12).getTime());

    await expect(
      createAppointment.execute({
        date: new Date(2021, 0, 10, 13),
        provider_id: '123123123',
        user_id: '123123123',
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('should not be able to create an appointment outside office hours', async () => {
    jest
      .spyOn(Date, 'now')
      .mockImplementationOnce(() => new Date(2021, 0, 10, 12).getTime());

    await expect(
      createAppointment.execute({
        date: new Date(2021, 0, 11, 7),
        provider_id: '123123123',
        user_id: '123456789',
      }),
    ).rejects.toBeInstanceOf(AppError);

    await expect(
      createAppointment.execute({
        date: new Date(2021, 0, 11, 18),
        provider_id: '123123123',
        user_id: '123456789',
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});

import type { Knex } from 'knex';
import { hashPassword } from '../../utils/password';

async function resetSequence(knex: Knex, table: string): Promise<void> {
  await knex.raw(
    "SELECT setval(pg_get_serial_sequence(?, 'id'), COALESCE((SELECT MAX(id) FROM ??), 1))",
    [table, table],
  );
}

export async function seed(knex: Knex): Promise<void> {
  await knex.raw('TRUNCATE TABLE rentals, vehicles, staff RESTART IDENTITY CASCADE');

  const passwordHash = await hashPassword('password123');

  await knex('staff').insert([
    { id: 1, email: 'admin@rental.com', password_hash: passwordHash, name: 'Admin User' },
  ]);

  await knex('vehicles').insert([
    {
      id: 1,
      name: 'Toyota Corolla',
      plate_number: 'DHA-1234',
      category: 'Sedan',
      daily_rate: 1000.0,
      deleted_at: null,
    },
    {
      id: 2,
      name: 'Toyota RAV4',
      plate_number: 'DHA-5678',
      category: 'SUV',
      daily_rate: 75.0,
      deleted_at: null,
    },
    {
      id: 3,
      name: 'Honda Civic',
      plate_number: 'DHA-9012',
      category: 'Sedan',
      daily_rate: 50.0,
      deleted_at: null,
    },
    {
      id: 4,
      name: 'BMW 5 Series',
      plate_number: 'DHA-3456',
      category: 'Luxury',
      daily_rate: 150.0,
      deleted_at: null,
    },
    {
      id: 5,
      name: 'Toyota Hiace',
      plate_number: 'DHA-7890',
      category: 'Van',
      daily_rate: 90.0,
      deleted_at: null,
    },
    {
      id: 6,
      name: 'Suzuki Alto',
      plate_number: 'DHA-2468',
      category: 'Hatchback',
      daily_rate: 30.0,
      deleted_at: null,
    },
    {
      id: 7,
      name: 'Toyota Prius',
      plate_number: 'DHA-1357',
      category: 'Hybrid',
      daily_rate: 60.0,
      deleted_at: knex.fn.now(),
    },
  ]);

  await resetSequence(knex, 'vehicles');

  await knex('rentals').insert([
    {
      id: 1,
      vehicle_id: 1,
      customer_name: 'Sarah Rahman',
      customer_phone: '01711111111',
      start_date: '2026-07-29',
      end_date: '2026-08-03',
      total_amount: 6000.0,
      status: 'completed',
    },
    {
      id: 2,
      vehicle_id: 1,
      customer_name: 'Imran Hossain',
      customer_phone: '01722222222',
      start_date: '2026-08-10',
      end_date: '2026-08-12',
      total_amount: 3000.0,
      status: 'booked',
    },
    {
      id: 3,
      vehicle_id: 2,
      customer_name: 'Nusrat Jahan',
      customer_phone: '01733333333',
      start_date: '2026-08-05',
      end_date: '2026-08-09',
      total_amount: 375.0,
      status: 'ongoing',
    },
    {
      id: 4,
      vehicle_id: 2,
      customer_name: 'Farhan Ahmed',
      customer_phone: '01744444444',
      start_date: '2026-08-20',
      end_date: '2026-08-25',
      total_amount: 450.0,
      status: 'cancelled',
    },
    {
      id: 5,
      vehicle_id: 3,
      customer_name: 'Tania Akter',
      customer_phone: '01755555555',
      start_date: '2026-08-01',
      end_date: '2026-08-15',
      total_amount: 750.0,
      status: 'completed',
    },
    {
      id: 6,
      vehicle_id: 3,
      customer_name: 'Rafiq Islam',
      customer_phone: '01766666666',
      start_date: '2026-08-20',
      end_date: '2026-08-22',
      total_amount: 150.0,
      status: 'booked',
    },
    {
      id: 7,
      vehicle_id: 4,
      customer_name: 'Mehzabin Chowdhury',
      customer_phone: '01777777777',
      start_date: '2026-08-02',
      end_date: '2026-08-05',
      total_amount: 600.0,
      status: 'ongoing',
    },
    {
      id: 8,
      vehicle_id: 4,
      customer_name: 'Arif Rahman',
      customer_phone: '01788888888',
      start_date: '2026-06-15',
      end_date: '2026-06-20',
      total_amount: 900.0,
      status: 'completed',
    },
    {
      id: 9,
      vehicle_id: 5,
      customer_name: 'Shakil Khan',
      customer_phone: '01799999999',
      start_date: '2026-07-25',
      end_date: '2026-07-28',
      total_amount: 360.0,
      status: 'completed',
    },
    {
      id: 10,
      vehicle_id: 5,
      customer_name: 'Rima Sultana',
      customer_phone: '01811111111',
      start_date: '2026-08-18',
      end_date: '2026-08-21',
      total_amount: 360.0,
      status: 'booked',
    },
    {
      id: 11,
      vehicle_id: 6,
      customer_name: 'Kamal Uddin',
      customer_phone: '01822222222',
      start_date: '2026-07-01',
      end_date: '2026-07-10',
      total_amount: 300.0,
      status: 'completed',
    },
    {
      id: 12,
      vehicle_id: 6,
      customer_name: 'Lubna Haque',
      customer_phone: '01833333333',
      start_date: '2026-07-15',
      end_date: '2026-07-20',
      total_amount: 180.0,
      status: 'cancelled',
    },
    {
      id: 13,
      vehicle_id: 7,
      customer_name: 'Deleted Fleet Customer',
      customer_phone: '01844444444',
      start_date: '2026-06-01',
      end_date: '2026-06-05',
      total_amount: 300.0,
      status: 'completed',
    },
  ]);

  await resetSequence(knex, 'rentals');
}

// Data access layer for Streak entity
import type { Streak } from '@/domain/models/Streak';

export class StreakRepository {
  async findAll(): Promise<Streak[]> {
    // Repository implementation
    return [];
  }

  async findById(id: string): Promise<Streak | null> {
    // Repository implementation
    return null;
  }

  async create(streak: Omit<Streak, 'id'>): Promise<Streak> {
    // Repository implementation
    throw new Error('Not implemented');
  }

  async update(id: string, streak: Partial<Streak>): Promise<Streak> {
    // Repository implementation
    throw new Error('Not implemented');
  }

  async delete(id: string): Promise<void> {
    // Repository implementation
    throw new Error('Not implemented');
  }
}

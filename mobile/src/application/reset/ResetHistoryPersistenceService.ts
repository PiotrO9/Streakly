import { DatabaseError } from '@/data/database/db';
import type {
  CreateResetHistoryInput,
  IResetHistoryRepository,
} from '@/data/repositories/IResetHistoryRepository';
import type { ResetHistoryEntry } from '@/domain/models/ResetHistory';

export interface PersistResetHistoryDependencies {
  resetHistoryRepository: IResetHistoryRepository;
  logError?: (message: string, error: unknown) => void;
}

/**
 * Persists a single ResetHistoryEntry using the provided repository.
 *
 * Responsibilities:
 * - Maps a domain ResetHistoryEntry to CreateResetHistoryInput.
 * - Uses async/await over the ResetHistoryRepository.create method.
 * - Does not mutate the provided domain object.
 * - Logs and rethrows errors so callers can decide how to handle failures.
 *
 * This function is intentionally kept out of UI components to maintain
 * a clear separation between presentation and persistence concerns.
 */
export async function persistResetHistoryEntry(
  entry: ResetHistoryEntry,
  dependencies: PersistResetHistoryDependencies
): Promise<ResetHistoryEntry> {
  const { resetHistoryRepository, logError } = dependencies;

  const createInput: CreateResetHistoryInput = mapEntryToCreateInput(entry);

  try {
    const createdEntry = await resetHistoryRepository.create(createInput);

    return createdEntry;
  } catch (error) {
    const message = '[ResetHistoryPersistence] Failed to persist reset history entry';

    if (typeof logError === 'function') {
      logError(message, error);
    } else {
      // MVP logging strategy: console.error without side effects in UI
      // eslint-disable-next-line no-console
      console.error(message, error);
    }

    // Surface the error to the caller in a deterministic way.
    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError(
      'Unexpected error while persisting ResetHistoryEntry',
      undefined,
      undefined,
      error
    );
  }
}

function mapEntryToCreateInput(entry: ResetHistoryEntry): CreateResetHistoryInput {
  return {
    addictionId: entry.addictionId,
    occurredAt: entry.occurredAt,
    recordedAt: entry.recordedAt,
    reason: entry.reason,
    previousStreakDays: entry.previousStreakDays,
    newStreakDays: entry.newStreakDays,
    note: entry.note,
  };
}

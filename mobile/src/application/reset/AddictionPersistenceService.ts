import { DatabaseError } from '@/data/database/db';
import type {
  IAddictionRepository,
  UpdateAddictionInput,
} from '@/data/repositories/IAddictionRepository';
import type { Addiction } from '@/domain/models/Addiction';

export interface PersistAddictionUpdateDependencies {
  addictionRepository: IAddictionRepository;
  logError?: (message: string, error: unknown) => void;
}

/**
 * Persists an updated Addiction's reset-related fields using the provided repository.
 *
 * Responsibilities:
 * - Extracts reset-related fields from the updated Addiction domain object.
 * - Maps to UpdateAddictionInput for the repository.
 * - Uses async/await over the AddictionRepository.update method.
 * - Does not mutate the provided domain object.
 * - Logs and rethrows errors so callers can decide how to handle failures.
 *
 * This function is intentionally kept out of UI components to maintain
 * a clear separation between presentation and persistence concerns.
 *
 * @param updatedAddiction - Updated Addiction domain object (from reset domain logic)
 * @param dependencies - Repository and optional error logger
 * @returns Persisted Addiction entity (fresh from database)
 * @throws DatabaseError if persistence fails
 */
export async function persistAddictionUpdate(
  updatedAddiction: Addiction,
  dependencies: PersistAddictionUpdateDependencies
): Promise<Addiction> {
  const { addictionRepository, logError } = dependencies;

  const updateInput: UpdateAddictionInput = mapAddictionToUpdateInput(updatedAddiction);

  try {
    const persistedAddiction = await addictionRepository.update(updatedAddiction.id, updateInput);

    return persistedAddiction;
  } catch (error) {
    const message = '[AddictionPersistence] Failed to persist addiction update';

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
      'Unexpected error while persisting Addiction update',
      undefined,
      undefined,
      error
    );
  }
}

/**
 * Maps an updated Addiction domain object to UpdateAddictionInput.
 *
 * Only includes fields that should be persisted after a reset:
 * - lastResetAt (critical for streak calculation)
 * - longestStreakDays (if updated)
 * - resetCount (if updated)
 *
 * Note: Other fields (name, isArchived, etc.) are intentionally excluded
 * as they are not part of the reset operation.
 */
function mapAddictionToUpdateInput(addiction: Addiction): UpdateAddictionInput {
  return {
    lastResetAt: addiction.lastResetAt,
    // Include other reset-related fields if they exist in schema
    // Note: Currently only lastResetAt is persisted; longestStreakDays and resetCount
    // are merged in memory by the repository until migrations add these columns.
    longestStreakDays: addiction.longestStreakDays,
    resetCount: addiction.resetCount,
  };
}

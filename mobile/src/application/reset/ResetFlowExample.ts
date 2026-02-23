/**
 * Example: Complete reset flow integration
 *
 * This file demonstrates how to:
 * 1. Call the pure domain reset logic
 * 2. Persist both the updated Addiction and ResetHistoryEntry
 * 3. Handle errors appropriately
 * 4. Order operations correctly
 *
 * This is NOT meant to be imported directly - use this as a reference
 * for implementing the reset handler in your UI component.
 */
import { AddictionRepository } from '@/data/repositories';
import { ResetHistoryRepository } from '@/data/repositories';
import type { Addiction } from '@/domain/models/Addiction';
import type { ResetHistoryId } from '@/domain/models/ResetHistory';
import { resetAddictionStreak } from '@/domain/services/AddictionResetService';

import { persistAddictionUpdate } from './AddictionPersistenceService';
import { persistResetHistoryEntry } from './ResetHistoryPersistenceService';

/**
 * Generates a UUID v4 string for reset history entry ID.
 * Uses expo-crypto if available, falls back to simple implementation.
 */
function generateResetHistoryId(): ResetHistoryId {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { randomUUID } = require('expo-crypto');
    return randomUUID();
  } catch {
    // Fallback: simple UUID v4 generator for MVP
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

/**
 * Complete reset flow: domain logic + persistence
 *
 * Order of operations:
 * 1. Generate reset ID (pure, no side effects)
 * 2. Call pure domain logic (produces updated Addiction + ResetHistoryEntry)
 * 3. Persist Addiction update FIRST (source of truth for streak calculation)
 * 4. Persist ResetHistoryEntry SECOND (analytics/history)
 *
 * Error handling:
 * - If Addiction persistence fails, the reset is not recorded (atomicity)
 * - If ResetHistory persistence fails, the Addiction is already updated
 *   (acceptable for MVP - history is supplementary)
 * - Both errors are surfaced to caller for UI handling
 */
export async function executeResetFlow(
  addiction: Addiction,
  options?: {
    reason?: 'relapse' | 'slip' | 'planned' | 'manual' | 'unknown';
    note?: string;
    occurredAt?: Date;
  }
): Promise<{
  updatedAddiction: Addiction;
  resetHistoryEntry: Awaited<ReturnType<typeof persistResetHistoryEntry>>;
}> {
  const now = new Date();
  const resetId = generateResetHistoryId();

  // Step 1: Pure domain logic (no side effects)
  const resetResult = resetAddictionStreak({
    addiction,
    now,
    resetId,
    reason: options?.reason,
    note: options?.note,
    occurredAt: options?.occurredAt,
  });

  // Step 2: Persist Addiction update FIRST (critical for streak calculation)
  const addictionRepository = new AddictionRepository();
  const persistedAddiction = await persistAddictionUpdate(resetResult.updatedAddiction, {
    addictionRepository,
  });

  // Step 3: Persist ResetHistoryEntry SECOND (analytics/history)
  const resetHistoryRepository = new ResetHistoryRepository();
  const persistedHistoryEntry = await persistResetHistoryEntry(resetResult.resetHistoryEntry, {
    resetHistoryRepository,
  });

  return {
    updatedAddiction: persistedAddiction,
    resetHistoryEntry: persistedHistoryEntry,
  };
}

/**
 * Example usage in UI component (e.g., DashboardScreen):
 *
 * ```typescript
 * async function handleResetPress(addiction: Addiction) {
 *   try {
 *     const result = await executeResetFlow(addiction, {
 *       reason: 'relapse',
 *       note: 'User-initiated reset',
 *     });
 *
 *     // Success: refresh UI
 *     await fetchAddictions();
 *     // Optionally show success message
 *   } catch (error) {
 *     // Handle error: show error message to user
 *     console.error('Reset failed:', error);
 *     // Show error toast/alert
 *   }
 * }
 * ```
 */

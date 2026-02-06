# Reset Flow Persistence Guide

## Overview

This guide explains how to persist Addiction updates after a streak reset. The reset flow consists of:

1. **Pure domain logic** (`resetAddictionStreak`) - produces updated Addiction + ResetHistoryEntry
2. **Addiction persistence** (`persistAddictionUpdate`) - updates `lastResetAt` in database
3. **ResetHistory persistence** (`persistResetHistoryEntry`) - records the reset event

## Architecture

```
UI Component (DashboardScreen)
    ↓
executeResetFlow (orchestrator)
    ↓
resetAddictionStreak (pure domain logic)
    ↓
persistAddictionUpdate → AddictionRepository.update
persistResetHistoryEntry → ResetHistoryRepository.create
```

## 1. Recommended Place in Reset Flow

**Location**: `mobile/src/application/reset/AddictionPersistenceService.ts`

**When to call**: Immediately after domain logic, before ResetHistory persistence.

**Why**: The Addiction's `lastResetAt` is the source of truth for streak calculation. It must be persisted first to ensure data consistency.

## 2. How to Call Repository Update

The `AddictionRepository.update` method accepts:
- `id: AddictionId` - The addiction's unique identifier
- `input: UpdateAddictionInput` - Partial update object with optional fields

**Key fields for reset**:
- `lastResetAt: Date` - **Required** - Updates the streak start timestamp
- `longestStreakDays?: number` - Optional (merged in memory until migration)
- `resetCount?: number` - Optional (merged in memory until migration)

**Example**:
```typescript
const updateInput: UpdateAddictionInput = {
  lastResetAt: updatedAddiction.lastResetAt,
  longestStreakDays: updatedAddiction.longestStreakDays,
  resetCount: updatedAddiction.resetCount,
};

const persisted = await addictionRepository.update(addiction.id, updateInput);
```

## 3. Example TypeScript Code

### Service Function

```typescript
// mobile/src/application/reset/AddictionPersistenceService.ts
export async function persistAddictionUpdate(
  updatedAddiction: Addiction,
  dependencies: PersistAddictionUpdateDependencies,
): Promise<Addiction> {
  const { addictionRepository, logError } = dependencies;

  const updateInput: UpdateAddictionInput = {
    lastResetAt: updatedAddiction.lastResetAt,
    longestStreakDays: updatedAddiction.longestStreakDays,
    resetCount: updatedAddiction.resetCount,
  };

  try {
    return await addictionRepository.update(updatedAddiction.id, updateInput);
  } catch (error) {
    // Error handling (see section 4)
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError('Unexpected error', undefined, undefined, error);
  }
}
```

### Complete Reset Flow

```typescript
// In your UI component (e.g., DashboardScreen.tsx)
import { resetAddictionStreak } from '@/domain/services/AddictionResetService';
import { persistAddictionUpdate } from '@/application/reset/AddictionPersistenceService';
import { persistResetHistoryEntry } from '@/application/reset/ResetHistoryPersistenceService';
import { AddictionRepository } from '@/data/repositories';
import { ResetHistoryRepository } from '@/data/repositories';

async function handleResetPress(addiction: Addiction) {
  const now = new Date();
  const resetId = generateUUID(); // Use expo-crypto or fallback

  try {
    // Step 1: Pure domain logic
    const resetResult = resetAddictionStreak({
      addiction,
      now,
      resetId,
      reason: 'manual',
    });

    // Step 2: Persist Addiction FIRST (source of truth)
    const addictionRepo = new AddictionRepository();
    const persistedAddiction = await persistAddictionUpdate(
      resetResult.updatedAddiction,
      { addictionRepository: addictionRepo }
    );

    // Step 3: Persist ResetHistory SECOND (analytics)
    const historyRepo = new ResetHistoryRepository();
    await persistResetHistoryEntry(
      resetResult.resetHistoryEntry,
      { resetHistoryRepository: historyRepo }
    );

    // Success: refresh UI
    await fetchAddictions();
  } catch (error) {
    // Handle error (show toast/alert to user)
    console.error('Reset failed:', error);
  }
}
```

## 4. Error Handling Strategy

### Principles

1. **Explicit error handling**: All errors are caught, logged, and rethrown
2. **DatabaseError wrapping**: Non-DatabaseError exceptions are wrapped for consistency
3. **Caller decides**: Errors are surfaced to UI layer for user feedback

### Error Flow

```
Repository throws DatabaseError
    ↓
Persistence service catches, logs, rethrows
    ↓
UI component catches, shows error to user
```

### Example Error Handling

```typescript
try {
  const persisted = await persistAddictionUpdate(updatedAddiction, {
    addictionRepository: repo,
    logError: (message, error) => {
      // Custom logging (e.g., Sentry, analytics)
      console.error(message, error);
    },
  });
} catch (error) {
  if (error instanceof DatabaseError) {
    // Database-specific error (e.g., constraint violation, not found)
    showErrorToast('Failed to save reset. Please try again.');
  } else {
    // Unexpected error
    showErrorToast('An unexpected error occurred.');
  }
}
```

## 5. Ordering Relative to ResetHistory Persistence

### Correct Order

1. **Persist Addiction update FIRST**
   - Updates `last_reset_at` in database
   - This is the source of truth for streak calculation
   - If this fails, the entire reset should fail (atomicity)

2. **Persist ResetHistory entry SECOND**
   - Records the reset event for analytics
   - This is supplementary data
   - If this fails, the Addiction is already updated (acceptable for MVP)

### Rationale

- **Addiction is primary**: The `lastResetAt` field drives streak calculation
- **History is secondary**: ResetHistory is for analytics and future sync
- **MVP simplicity**: For MVP, partial success (Addiction updated, history failed) is acceptable
- **Future enhancement**: Consider transactions if both must succeed atomically

### Edge Case: History Persistence Fails

**Current behavior**: Addiction is updated, history is not recorded.

**MVP approach**: Acceptable - the streak is correct, history can be reconstructed if needed.

**Future enhancement**: Consider:
- Retry logic for history persistence
- Transaction wrapping (if SQLite transactions are added)
- Queue for failed history writes

## 6. Edge Cases

### Multiple Resets in Short Time

**Scenario**: User resets twice within seconds/minutes.

**Current behavior**:
- Each reset creates a new `lastResetAt` timestamp
- Each reset creates a separate ResetHistoryEntry
- `previousStreakDays` for the second reset will be `0` (since first reset just happened)

**Handling**:
- Domain logic already handles this (no restrictions)
- Persistence works correctly (each update overwrites `last_reset_at`)
- History entries are distinct (different IDs, timestamps)

**Example**:
```typescript
// Reset 1 at 10:00:00
await executeResetFlow(addiction); // lastResetAt = 10:00:00

// Reset 2 at 10:00:05 (5 seconds later)
await executeResetFlow(addiction); // lastResetAt = 10:00:05
// History entry shows previousStreakDays = 0
```

### Concurrent Resets

**Scenario**: User taps reset button multiple times rapidly.

**Current behavior**: No built-in locking mechanism.

**Handling**:
- **UI-level**: Disable reset button during async operation
- **Application-level**: Consider debouncing or request queuing
- **Database-level**: SQLite handles concurrent writes (last write wins)

**Example**:
```typescript
const [isResetting, setIsResetting] = useState(false);

async function handleResetPress(addiction: Addiction) {
  if (isResetting) return; // Prevent concurrent resets
  
  setIsResetting(true);
  try {
    await executeResetFlow(addiction);
  } finally {
    setIsResetting(false);
  }
}
```

### Addiction Deleted During Reset

**Scenario**: User deletes addiction while reset is in progress.

**Current behavior**: `AddictionRepository.update` throws `DatabaseError` if addiction not found.

**Handling**:
- Error is caught and surfaced to UI
- User sees error message
- No partial state (reset is not applied)

### Network/Storage Failure

**Scenario**: SQLite write fails (disk full, permissions, etc.).

**Current behavior**: `DatabaseError` is thrown and caught.

**Handling**:
- Error is logged
- User sees error message
- Reset is not applied (atomicity maintained)

## 7. Testing Considerations

### Unit Tests

- Test `persistAddictionUpdate` with mock repository
- Verify `lastResetAt` is correctly mapped to `UpdateAddictionInput`
- Test error handling paths

### Integration Tests

- Test complete reset flow with real SQLite database
- Verify `last_reset_at` is updated in database
- Verify ResetHistoryEntry is created
- Test error scenarios (not found, constraint violations)

### Edge Case Tests

- Multiple rapid resets
- Reset after deletion
- Reset with invalid dates

## 8. Future Enhancements

### Transaction Support

If both Addiction and ResetHistory must succeed atomically:

```typescript
// Future: Wrap in transaction
await db.transaction(async (tx) => {
  await persistAddictionUpdate(updatedAddiction, { ... });
  await persistResetHistoryEntry(historyEntry, { ... });
});
```

### Retry Logic

For transient failures:

```typescript
async function persistWithRetry(fn: () => Promise<void>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fn();
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(1000 * (i + 1)); // Exponential backoff
    }
  }
}
```

### Batch Updates

If multiple addictions need reset:

```typescript
// Future: Batch persistence
await Promise.all(
  addictions.map(addiction => executeResetFlow(addiction))
);
```

## Summary

- **Place**: `AddictionPersistenceService.ts` in `application/reset/`
- **Call**: After domain logic, before ResetHistory persistence
- **Method**: `AddictionRepository.update(id, { lastResetAt, ... })`
- **Error handling**: Catch, log, rethrow for UI handling
- **Ordering**: Addiction first (source of truth), History second (analytics)
- **Edge cases**: Multiple resets allowed, concurrent resets need UI protection

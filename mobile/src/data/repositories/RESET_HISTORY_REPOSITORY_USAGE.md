# ResetHistoryRepository Usage Guide

## Overview

The `ResetHistoryRepository` provides a clean abstraction for persisting ResetHistoryEntry entities in SQLite. It handles persistence operations and maps between domain models and database rows.

## File Location

- **Interface**: `mobile/src/data/repositories/IResetHistoryRepository.ts`
- **Implementation**: `mobile/src/data/repositories/ResetHistoryRepository.ts`
- **Exports**: `mobile/src/data/repositories/index.ts`

## Quick Start

```typescript
import { ResetHistoryRepository } from '@/data/repositories';

// Create repository instance
const repository = new ResetHistoryRepository();

// Create a new reset history entry
const entry = await repository.create({
  addictionId: 'addiction-123',
  occurredAt: new Date('2025-01-15T21:30:00Z'),
  recordedAt: new Date('2025-01-15T21:35:00Z'),
  reason: 'relapse',
  previousStreakDays: 12,
  newStreakDays: 0,
  note: 'Strong craving after stressful day',
});

// Find by id
const found = await repository.findById(entry.id);

// List all resets for a specific addiction
const history = await repository.findByAddictionId('addiction-123');

// List all resets across all addictions
const allResets = await repository.findAll();
```

## API Reference

### `create(input: CreateResetHistoryInput): Promise<ResetHistoryEntry>`

Creates a new ResetHistoryEntry. The `id` is automatically generated.

**Input:**
- `addictionId: AddictionId` - Reference to the addiction (required)
- `occurredAt: Date` - When the reset actually happened (required)
- `recordedAt: Date` - When the reset was recorded in the app (required)
- `reason: ResetReason` - Reason for reset: 'relapse' | 'slip' | 'planned' | 'manual' | 'unknown' (required)
- `previousStreakDays: number` - Days in streak before reset (required)
- `newStreakDays: number` - Days in streak after reset (required)
- `note?: string` - Optional free-form note

**Returns:** Created ResetHistoryEntry with generated `id`

**Throws:** `DatabaseError` if creation fails

**Example:**
```typescript
const entry = await repository.create({
  addictionId: 'smoking-001',
  occurredAt: new Date('2025-01-15T21:30:00Z'),
  recordedAt: new Date('2025-01-15T21:35:00Z'),
  reason: 'relapse',
  previousStreakDays: 12,
  newStreakDays: 0,
  note: 'Stressful work day',
});
```

### `findById(id: ResetHistoryId): Promise<ResetHistoryEntry | null>`

Retrieves a ResetHistoryEntry by its unique identifier.

**Parameters:**
- `id: string` - Unique identifier

**Returns:** ResetHistoryEntry entity or `null` if not found

**Throws:** `DatabaseError` if query fails

**Example:**
```typescript
const entry = await repository.findById('reset-123');
if (entry) {
  console.log(`Reset occurred at: ${entry.occurredAt}`);
}
```

### `findByAddictionId(addictionId: AddictionId): Promise<ResetHistoryEntry[]>`

Retrieves all ResetHistoryEntry entities for a specific addiction, ordered by `occurredAt` descending (most recent first).

**Parameters:**
- `addictionId: string` - The addiction identifier

**Returns:** Array of ResetHistoryEntry entities (empty array if none exist)

**Throws:** `DatabaseError` if query fails

**Example:**
```typescript
const history = await repository.findByAddictionId('smoking-001');
console.log(`Total resets: ${history.length}`);
history.forEach((entry) => {
  console.log(`${entry.occurredAt}: ${entry.reason}`);
});
```

### `findAll(): Promise<ResetHistoryEntry[]>`

Retrieves all ResetHistoryEntry entities across all addictions, ordered by `occurredAt` descending (most recent first).

**Returns:** Array of all ResetHistoryEntry entities (empty array if none exist)

**Throws:** `DatabaseError` if query fails

**Example:**
```typescript
const allResets = await repository.findAll();
console.log(`Total resets across all addictions: ${allResets.length}`);
```

## SQL Queries Used

### Create
```sql
INSERT INTO reset_history (id, addiction_id, reset_at)
VALUES (?, ?, ?)
```

### Find by ID
```sql
SELECT id, addiction_id, reset_at 
FROM reset_history 
WHERE id = ?
```

### Find by Addiction ID
```sql
SELECT id, addiction_id, reset_at 
FROM reset_history 
WHERE addiction_id = ? 
ORDER BY reset_at DESC
```

### Find All
```sql
SELECT id, addiction_id, reset_at 
FROM reset_history 
ORDER BY reset_at DESC
```

## Mapping Logic

### Database Row → Domain Model

The repository maps database rows to domain models:

- `id` → `id`
- `addiction_id` → `addictionId`
- `reset_at` (INTEGER milliseconds) → `occurredAt` (Date)
- `reset_at` → `recordedAt` (MVP limitation: uses same timestamp)
- Defaults: `reason: 'unknown'`, `previousStreakDays: 0`, `newStreakDays: 0`
- Optional fields: `note`, `metadata`, `sync` are undefined

### Domain Model → Database Row

For INSERT operations:

- `id` → `id`
- `addictionId` → `addiction_id`
- `occurredAt` (Date) → `reset_at` (INTEGER milliseconds)

**Note:** Current schema only stores `occurredAt`. Other fields (`recordedAt`, `reason`, `previousStreakDays`, etc.) are preserved in the returned domain object but not persisted. Future migrations should add columns for full domain model support.

## Schema Limitations (MVP)

The current migration (002) only stores:
- `id` (TEXT PRIMARY KEY)
- `addiction_id` (TEXT)
- `reset_at` (INTEGER - Unix timestamp in milliseconds)

The domain model includes additional fields that are not yet persisted:
- `recordedAt` - Currently uses same value as `occurredAt`
- `reason` - Defaults to 'unknown' when reading from DB
- `previousStreakDays` - Defaults to 0 when reading from DB
- `newStreakDays` - Defaults to 0 when reading from DB
- `note` - Not persisted
- `metadata` - Not persisted
- `sync` - Not persisted

**Future Migration Needed:**
```sql
ALTER TABLE reset_history ADD COLUMN recorded_at INTEGER;
ALTER TABLE reset_history ADD COLUMN reason TEXT;
ALTER TABLE reset_history ADD COLUMN previous_streak_days INTEGER;
ALTER TABLE reset_history ADD COLUMN new_streak_days INTEGER;
ALTER TABLE reset_history ADD COLUMN note TEXT;
-- metadata and sync can be stored as JSON TEXT or separate columns
```

## Indexing and Performance

### Existing Indexes

The migration creates two indexes:

1. **`idx_reset_history_addiction_id`** - Single column index on `addiction_id`
   - Optimizes `findByAddictionId()` queries
   - Most common query pattern

2. **`idx_reset_history_addiction_reset_at`** - Composite index on `(addiction_id, reset_at)`
   - Optimizes `findByAddictionId()` with ORDER BY `reset_at DESC`
   - Covers both filtering and sorting

### Query Performance

- **`findById()`**: Uses PRIMARY KEY index (O(log n))
- **`findByAddictionId()`**: Uses composite index (O(log n) + sort optimization)
- **`findAll()`**: Full table scan with sort (O(n log n))

### Recommendations

For large datasets (1000+ entries per addiction):

1. **Pagination**: Consider adding `limit` and `offset` parameters to `findByAddictionId()` and `findAll()`
2. **Date Range Queries**: Add optional `startDate` and `endDate` filters for analytics
3. **Additional Indexes**: If querying by `reason` becomes common, add index on `reason`

Example future API:
```typescript
findByAddictionId(
  addictionId: AddictionId,
  options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<ResetHistoryEntry[]>
```

## Error Handling

All methods throw `DatabaseError` on failure:

```typescript
import { DatabaseError } from '@/data/database/db';

try {
  const entry = await repository.create(input);
} catch (error) {
  if (error instanceof DatabaseError) {
    console.error('Database error:', error.message);
    console.error('SQL:', error.sql);
    console.error('Params:', error.params);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Usage in Domain Services

The repository should be used by domain services, not directly by UI components:

```typescript
// ✅ Good: Domain service uses repository
import { ResetHistoryRepository } from '@/data/repositories';

class ResetHistoryService {
  constructor(private repository: ResetHistoryRepository) {}

  async getResetHistory(addictionId: string): Promise<ResetHistoryEntry[]> {
    return this.repository.findByAddictionId(addictionId);
  }
}

// ❌ Bad: UI component directly uses repository
// Keep repositories in data layer, not presentation layer
```

## Testing

For testing, you can create an in-memory implementation or mock:

```typescript
class InMemoryResetHistoryRepository implements IResetHistoryRepository {
  private entries: ResetHistoryEntry[] = [];

  async create(input: CreateResetHistoryInput): Promise<ResetHistoryEntry> {
    const entry: ResetHistoryEntry = {
      id: generateUUID(),
      ...input,
    };
    this.entries.push(entry);
    return entry;
  }

  async findById(id: ResetHistoryId): Promise<ResetHistoryEntry | null> {
    return this.entries.find((e) => e.id === id) ?? null;
  }

  async findByAddictionId(addictionId: AddictionId): Promise<ResetHistoryEntry[]> {
    return this.entries
      .filter((e) => e.addictionId === addictionId)
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }

  async findAll(): Promise<ResetHistoryEntry[]> {
    return [...this.entries].sort(
      (a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()
    );
  }
}
```

## Integration Example

Complete example integrating with AddictionResetService:

```typescript
import { ResetHistoryRepository } from '@/data/repositories';
import { resetAddictionStreak } from '@/domain/services/AddictionResetService';
import type { Addiction } from '@/domain/models/Addiction';

async function handleReset(
  addiction: Addiction,
  occurredAt: Date,
  reason: 'relapse' | 'slip' | 'planned' | 'manual' | 'unknown',
  note?: string
) {
  // Domain logic: calculate reset result
  const resetResult = resetAddictionStreak({
    addiction,
    occurredAt,
    reason,
    note,
    now: new Date(),
  });

  // Persist reset history
  const repository = new ResetHistoryRepository();
  const historyEntry = await repository.create({
    addictionId: addiction.id,
    occurredAt: resetResult.resetHistoryEntry.occurredAt,
    recordedAt: resetResult.resetHistoryEntry.recordedAt,
    reason: resetResult.resetHistoryEntry.reason,
    previousStreakDays: resetResult.resetHistoryEntry.previousStreakDays,
    newStreakDays: resetResult.resetHistoryEntry.newStreakDays,
    note: resetResult.resetHistoryEntry.note,
  });

  return {
    updatedAddiction: resetResult.updatedAddiction,
    historyEntry,
  };
}
```

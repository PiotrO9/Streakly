# Data Mappers

## Overview

The mapper layer provides **pure, explicit functions** for converting between SQLite database rows and domain models. This separation keeps persistence concerns out of the domain layer and makes mapping logic easy to test and maintain.

## Location

All mapper functions live in `mobile/src/data/mappers/`:

- `AddictionMapper.ts` - Addiction ↔ SQLite row mapping
- `ResetHistoryMapper.ts` - ResetHistoryEntry ↔ SQLite row mapping
- `index.ts` - Exports all mappers

## Design Principles

1. **Pure Functions**: No side effects, no mutation
2. **Explicit**: Clear input/output types, no magic
3. **Type-Safe**: Full TypeScript typing, no `any`
4. **Testable**: Easy to unit test in isolation
5. **Maintainable**: Clear separation of concerns

## Mapping Functions

### AddictionMapper

#### `rowToDomain(row: AddictionRow): Addiction`

Converts a SQLite row to a domain `Addiction` entity.

**Input Example:**
```typescript
const row: AddictionRow = {
  id: 'abc-123',
  name: 'Smoking',
  created_at: 1705315800000,        // INTEGER milliseconds
  last_reset_at: 1705315800000,      // INTEGER milliseconds (nullable)
};
```

**Output Example:**
```typescript
const addiction: Addiction = {
  id: 'abc-123',
  name: 'Smoking',
  createdAt: Date('2024-01-15T10:30:00Z'),
  lastResetAt: Date('2024-01-15T10:30:00Z'),
  longestStreakDays: 0,              // Default (not in schema yet)
  resetCount: 0,                     // Default (not in schema yet)
  isArchived: false,                 // Default (not in schema yet)
  archivedAt: undefined,
  resetHistory: undefined,
  metadata: undefined,
  sync: undefined,
};
```

**Handles:**
- ✅ Timestamp conversion (INTEGER → Date)
- ✅ Nullable `last_reset_at` (uses `createdAt` if null)
- ✅ Default values for fields not in schema

#### `domainToRowValues(addiction: {...}): AddictionRowValues`

Converts a domain `Addiction` to SQLite INSERT/UPDATE values.

**Input Example:**
```typescript
const addiction = {
  id: 'abc-123',
  name: 'Smoking',
  createdAt: new Date('2024-01-15T10:30:00Z'),
  lastResetAt: new Date('2024-01-15T10:30:00Z'),
  // ... other fields ignored (not in schema yet)
};
```

**Output Example:**
```typescript
const values: AddictionRowValues = [
  'abc-123',           // id
  'Smoking',            // name
  1705315800000,        // created_at (INTEGER)
  1705315800000,        // last_reset_at (INTEGER)
];
```

**Handles:**
- ✅ Timestamp conversion (Date → INTEGER)
- ✅ Only includes fields in current schema

### ResetHistoryMapper

#### `rowToDomain(row: ResetHistoryRow): ResetHistoryEntry`

Converts a SQLite row to a domain `ResetHistoryEntry` entity.

**Input Example:**
```typescript
const row: ResetHistoryRow = {
  id: 'reset-123',
  addiction_id: 'abc-123',
  reset_at: 1705315800000,           // INTEGER milliseconds
};
```

**Output Example:**
```typescript
const entry: ResetHistoryEntry = {
  id: 'reset-123',
  addictionId: 'abc-123',
  occurredAt: Date('2024-01-15T10:30:00Z'),
  recordedAt: Date('2024-01-15T10:30:00Z'),  // MVP: same as occurredAt
  reason: 'unknown',                  // Default (not in schema yet)
  previousStreakDays: 0,              // Default (not in schema yet)
  newStreakDays: 0,                   // Default (not in schema yet)
  note: undefined,
  metadata: undefined,
  sync: undefined,
};
```

**Handles:**
- ✅ Timestamp conversion (INTEGER → Date)
- ✅ MVP limitation: `recordedAt` uses same timestamp as `occurredAt`
- ✅ Default values for fields not in schema

#### `domainToRowValues(input: {...}): ResetHistoryRowValues`

Converts a domain `ResetHistoryEntry` to SQLite INSERT values.

**Input Example:**
```typescript
const entry = {
  id: 'reset-123',
  addictionId: 'abc-123',
  occurredAt: new Date('2024-01-15T10:30:00Z'),
  // ... other fields ignored (not in schema yet)
};
```

**Output Example:**
```typescript
const values: ResetHistoryRowValues = [
  'reset-123',         // id
  'abc-123',           // addiction_id
  1705315800000,       // reset_at (INTEGER)
];
```

**Handles:**
- ✅ Timestamp conversion (Date → INTEGER)
- ✅ Only includes fields in current schema

## Timestamp Handling

### SQLite Storage Format

- **Type**: `INTEGER` (64-bit signed integer)
- **Format**: Unix timestamp in **milliseconds** since epoch
- **Example**: `1705315800000` = `2024-01-15T10:30:00.000Z`

### Conversion Functions

Both mappers include helper functions:

```typescript
// Date → INTEGER milliseconds
dateToTimestamp(new Date('2024-01-15T10:30:00Z'))
// Returns: 1705315800000

// INTEGER milliseconds → Date
timestampToDate(1705315800000)
// Returns: Date('2024-01-15T10:30:00Z')
```

## Nullable Fields

### Addiction: `last_reset_at`

- **Database**: `INTEGER | null`
- **Domain**: `Date` (never null in domain)
- **Mapping**: If `null` in DB, use `createdAt` (new addiction, no resets)

```typescript
const lastResetAt = row.last_reset_at
  ? timestampToDate(row.last_reset_at)
  : createdAt;
```

### ResetHistory: All fields required

- Current schema has no nullable fields
- Future migrations may add nullable `note` column

## Schema Evolution

### Current Schema (MVP)

**addictions table:**
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT)
- `created_at` (INTEGER)
- `last_reset_at` (INTEGER nullable)

**reset_history table:**
- `id` (TEXT PRIMARY KEY)
- `addiction_id` (TEXT)
- `reset_at` (INTEGER)

### Future Migrations

When adding new columns, update:

1. **Row interfaces** (`AddictionRow`, `ResetHistoryRow`)
2. **Mapping functions** (`rowToDomain`, `domainToRowValues`)
3. **SQL queries** in repositories

**Example Future Schema:**
```sql
ALTER TABLE addictions ADD COLUMN longest_streak_days INTEGER DEFAULT 0;
ALTER TABLE addictions ADD COLUMN reset_count INTEGER DEFAULT 0;
ALTER TABLE addictions ADD COLUMN is_archived INTEGER DEFAULT 0;
ALTER TABLE addictions ADD COLUMN archived_at INTEGER;

ALTER TABLE reset_history ADD COLUMN recorded_at INTEGER;
ALTER TABLE reset_history ADD COLUMN reason TEXT DEFAULT 'unknown';
ALTER TABLE reset_history ADD COLUMN previous_streak_days INTEGER DEFAULT 0;
ALTER TABLE reset_history ADD COLUMN new_streak_days INTEGER DEFAULT 0;
ALTER TABLE reset_history ADD COLUMN note TEXT;
```

## Usage in Repositories

Repositories use mappers to convert between SQLite and domain:

```typescript
import { rowToDomain, domainToRowValues } from '@/data/mappers';

// In repository query:
const row = await executeQueryOne<AddictionRow>(sql, params);
return rowToDomain(row);

// In repository insert:
const values = domainToRowValues(addiction);
await executeRun(sql, values);
```

## Testing

Mappers are pure functions, making them easy to test:

```typescript
describe('AddictionMapper', () => {
  it('converts row to domain', () => {
    const row: AddictionRow = {
      id: 'test-123',
      name: 'Test',
      created_at: 1705315800000,
      last_reset_at: 1705315800000,
    };

    const addiction = rowToDomain(row);

    expect(addiction.id).toBe('test-123');
    expect(addiction.createdAt).toBeInstanceOf(Date);
    expect(addiction.lastResetAt).toBeInstanceOf(Date);
  });

  it('handles null last_reset_at', () => {
    const row: AddictionRow = {
      id: 'test-123',
      name: 'Test',
      created_at: 1705315800000,
      last_reset_at: null,
    };

    const addiction = rowToDomain(row);

    expect(addiction.lastResetAt).toEqual(addiction.createdAt);
  });
});
```

## Naming Conventions

- **Row interfaces**: `EntityNameRow` (e.g., `AddictionRow`)
- **Row values types**: `EntityNameRowValues` (e.g., `AddictionRowValues`)
- **Functions**: `rowToDomain`, `domainToRowValues`
- **Helpers**: `dateToTimestamp`, `timestampToDate`

## Benefits

1. **Separation of Concerns**: Persistence logic isolated from domain
2. **Testability**: Pure functions easy to unit test
3. **Maintainability**: Clear, explicit mapping logic
4. **Type Safety**: Full TypeScript support
5. **Evolution**: Easy to update when schema changes

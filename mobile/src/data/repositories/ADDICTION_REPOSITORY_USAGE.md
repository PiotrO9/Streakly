# AddictionRepository Usage Guide

## Overview

The `AddictionRepository` provides a clean abstraction for persisting Addiction entities in SQLite. It handles all CRUD operations and maps between domain models and database rows.

## File Location

- **Interface**: `mobile/src/data/repositories/IAddictionRepository.ts`
- **Implementation**: `mobile/src/data/repositories/AddictionRepository.ts`
- **Exports**: `mobile/src/data/repositories/index.ts`

## Quick Start

```typescript
import { AddictionRepository } from '@/data/repositories';

// Create repository instance
const repository = new AddictionRepository();

// Create a new addiction
const addiction = await repository.create({
  name: 'Smoking',
  createdAt: new Date(),
  lastResetAt: new Date(),
});

// Find by id
const found = await repository.findById(addiction.id);

// List all
const all = await repository.findAll();

// Update
const updated = await repository.update(addiction.id, {
  name: 'Smoking Cessation',
  lastResetAt: new Date(),
});

// Delete
await repository.delete(addiction.id);
```

## API Reference

### `create(input: CreateAddictionInput): Promise<Addiction>`

Creates a new Addiction entity. The `id` is automatically generated.

**Input:**

- `name: string` - Display name (required)
- `createdAt: Date` - Creation timestamp (required)
- `lastResetAt: Date` - Last reset timestamp (required)
- `longestStreakDays?: number` - Default: 0
- `resetCount?: number` - Default: 0
- `isArchived?: boolean` - Default: false
- `archivedAt?: Date` - Optional

**Returns:** Created Addiction with generated `id`

**Throws:** `DatabaseError` if creation fails

**Example:**

```typescript
const addiction = await repository.create({
  name: 'Alcohol',
  createdAt: new Date('2024-01-01'),
  lastResetAt: new Date('2024-01-01'),
  longestStreakDays: 0,
  resetCount: 0,
});
```

### `findById(id: AddictionId): Promise<Addiction | null>`

Retrieves an Addiction by its unique identifier.

**Parameters:**

- `id: string` - Unique identifier

**Returns:** Addiction entity or `null` if not found

**Throws:** `DatabaseError` if query fails

**Example:**

```typescript
const addiction = await repository.findById('abc-123-def');
if (addiction) {
  console.log(addiction.name);
}
```

### `findAll(): Promise<Addiction[]>`

Retrieves all Addiction entities, ordered by creation date (newest first).

**Returns:** Array of all Addiction entities (empty array if none exist)

**Throws:** `DatabaseError` if query fails

**Example:**

```typescript
const addictions = await repository.findAll();
addictions.forEach(a => console.log(a.name));
```

### `update(id: AddictionId, input: UpdateAddictionInput): Promise<Addiction>`

Updates an existing Addiction entity. Only provided fields are updated (partial update).

**Parameters:**

- `id: string` - Unique identifier
- `input: UpdateAddictionInput` - Partial update data

**Returns:** Updated Addiction entity

**Throws:** `DatabaseError` if update fails or entity not found

**Example:**

```typescript
const updated = await repository.update('abc-123-def', {
  name: 'Updated Name',
  lastResetAt: new Date(),
});
```

### `delete(id: AddictionId): Promise<void>`

Deletes an Addiction entity by id.

**Parameters:**

- `id: string` - Unique identifier

**Throws:** `DatabaseError` if deletion fails or entity not found

**Example:**

```typescript
await repository.delete('abc-123-def');
```

## SQL Queries Used

### Create

```sql
INSERT INTO addictions (id, name, created_at, last_reset_at)
VALUES (?, ?, ?, ?)
```

### Find By ID

```sql
SELECT id, name, created_at, last_reset_at
FROM addictions
WHERE id = ?
```

### Find All

```sql
SELECT id, name, created_at, last_reset_at
FROM addictions
ORDER BY created_at DESC
```

### Update

```sql
UPDATE addictions
SET name = ?, last_reset_at = ?
WHERE id = ?
```

### Delete

```sql
DELETE FROM addictions
WHERE id = ?
```

## Mapping Logic

### Database Row → Domain Model

The repository maps SQLite INTEGER timestamps to JavaScript `Date` objects:

- `created_at` (INTEGER milliseconds) → `createdAt` (Date)
- `last_reset_at` (INTEGER milliseconds, nullable) → `lastResetAt` (Date)
  - If `null` in DB, uses `createdAt` as fallback

Fields not yet in schema are set to defaults:

- `longestStreakDays: 0`
- `resetCount: 0`
- `isArchived: false`
- `archivedAt: undefined`
- `resetHistory: undefined`
- `metadata: undefined`
- `sync: undefined`

### Domain Model → Database Row

- `Date` objects → Unix timestamps in milliseconds (INTEGER)
- Only fields present in current schema are persisted

## Error Handling

All methods throw `DatabaseError` on failure:

```typescript
import { DatabaseError } from '@/data/database/db';

try {
  await repository.create({ ... });
} catch (error) {
  if (error instanceof DatabaseError) {
    console.error('SQL:', error.sql);
    console.error('Params:', error.params);
    console.error('Cause:', error.cause);
  }
}
```

## Current Schema Limitations

The current migration (001) only stores:

- `id` (TEXT)
- `name` (TEXT)
- `created_at` (INTEGER)
- `last_reset_at` (INTEGER, nullable)

**Missing fields** (not yet persisted):

- `longestStreakDays`
- `resetCount`
- `isArchived`
- `archivedAt`
- `resetHistory`
- `metadata`
- `sync`

These fields are returned with default values but are **not persisted** between sessions. Future migrations should add these columns.

## Future Extensibility

### Adding Filters

```typescript
// Future: findAll({ isArchived: false })
async findAll(filters?: { isArchived?: boolean }): Promise<Addiction[]> {
  // Add WHERE clause based on filters
}
```

### Adding Pagination

```typescript
// Future: findAll({ limit: 10, offset: 0 })
async findAll(options?: { limit?: number; offset?: number }): Promise<Addiction[]> {
  // Add LIMIT/OFFSET
}
```

### Soft Delete

```typescript
// Future: Instead of DELETE, set isArchived = true
async archive(id: AddictionId): Promise<void> {
  await this.update(id, { isArchived: true, archivedAt: new Date() });
}
```

### Sync Support

When adding backend sync:

1. Add `sync` columns to schema
2. Update mapping logic
3. Add `findUnsynced()` method
4. Add `markSynced()` method

## Integration with Services

Repositories are used by domain services, not directly by UI:

```typescript
// ✅ Good: Service uses Repository
class AddictionService {
  constructor(private repo: IAddictionRepository) {}

  async createAddiction(name: string): Promise<Addiction> {
    const now = new Date();
    return this.repo.create({
      name,
      createdAt: now,
      lastResetAt: now,
    });
  }
}

// ❌ Bad: UI uses Repository directly
function MyScreen() {
  const repo = new AddictionRepository();
  // Don't do this - use a service instead
}
```

## Testing

For testing, you can:

1. Use an in-memory SQLite database
2. Mock `IAddictionRepository` interface
3. Use dependency injection

Example test setup:

```typescript
import { IAddictionRepository } from '@/data/repositories';

class MockAddictionRepository implements IAddictionRepository {
  private data: Map<string, Addiction> = new Map();

  async create(input: CreateAddictionInput): Promise<Addiction> {
    const id = 'test-id';
    const addiction = { id, ...input };
    this.data.set(id, addiction);
    return addiction;
  }

  // ... implement other methods
}
```

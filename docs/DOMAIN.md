# Domain Model

## Domain Dictionary

### Streak

**Definition**: Consecutive days without addiction relapse.

**Properties**:
- `id`: Unique identifier
- `name`: Addiction/habit name (e.g., "Smoking", "Alcohol")
- `startDate`: Streak start date
- `currentCount`: Current days without relapse
- `longestCount`: Longest achieved streak
- `isActive`: Whether streak is active

**Business Rules**:
- Streak resets to 0 after relapse
- `longestCount` updates only when `currentCount` exceeds it
- Streak is active when `isActive === true`
- Days counted as **full elapsed 24-hour periods** since the streak start timestamp
  (e.g. since `createdAt` for a new addiction, or since `lastResetAt` after a reset).
  This is **not** a calendar-day count and is computed from timestamps to be timezone-safe.

### User

**Definition**: App user (single-user).

**Properties**:
- `id`: Unique identifier
- `name`: User name
- `createdAt`: Account creation date

**Note**: MVP assumes single local user.

## Domain Operations

### Streak Operations

- **Create Streak**: Create new streak
- **Update Streak**: Update streak data
- **Reset Streak**: Reset after relapse (currentCount → 0)
- **Increment Streak**: Increase counter by 1 day
- **Calculate Days**: Calculate days from startDate

### Validation Rules

- Streak name: min 1 char, max 50 chars
- startDate: cannot be in the future
- currentCount: always >= 0
- longestCount: always >= currentCount

## Entities vs Value Objects

- **Entities**: Streak, User (have identifier, mutable)
- **Value Objects**: Dates, numbers (immutable, no ID)

## Domain Events (Future)

For future expansion:
- `StreakCreated`
- `StreakReset`
- `StreakMilestoneReached` (e.g., 7, 30, 100 days)

Currently MVP does not use events.

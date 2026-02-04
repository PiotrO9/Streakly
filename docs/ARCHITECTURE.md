# Application Architecture

## Architecture Layers

The app uses Clean Architecture with clear layer separation:

### 1. Domain Layer (`src/domain/`)

**Purpose**: Business logic, independent of frameworks and infrastructure.

**Contents**:
- `models/` - Domain entities (Streak, User)
- `services/` - Business logic (StreakService, ValidationService)
- `types/` - Domain types

**Rules**:
- No React Native dependencies
- Pure functions and classes
- Unit testable

### 2. Data Layer (`src/data/`)

**Purpose**: Data access, abstraction over SQLite.

**Contents**:
- `database/` - SQLite configuration, migrations
- `repositories/` - Repository pattern implementation
- `types/` - Data layer types

**Rules**:
- Repository pattern for each entity
- Domain entities as returned interfaces
- Database migration handling

### 3. Presentation Layer (`src/screens/`, `src/components/`)

**Purpose**: UI, user interactions.

**Contents**:
- `screens/` - App screens
- `components/` - UI components (ui/, layout/)

**Rules**:
- Presentational components
- Business logic delegated to domain services
- Data access through repositories

### 4. Infrastructure (`src/utils/`, `src/constants/`)

**Purpose**: Helper utilities, configuration.

## Data Flow

```
Screen → Service → Repository → Database
         ↑
    Domain Model
```

1. **Screen** calls **Service**
2. **Service** uses **Repository** for data access
3. **Repository** returns **Domain Model**
4. **Service** executes business logic
5. **Screen** renders result

## Design Patterns

### Repository Pattern

Each domain entity has a corresponding Repository:
- `StreakRepository` for `Streak`
- `UserRepository` for `User`

Repository abstracts SQLite access.

### Service Layer

Services contain business logic:
- Validation
- Calculations (e.g., streak days)
- Business rules

### Dependency Flow

Dependencies flow inward only:
- Presentation → Domain
- Data → Domain
- Presentation may use Data (through Service)

## Database

- **SQLite** as local database
- Migrations in `src/data/database/migrations/`
- Initialization via `initializeDatabase()`
- Offline-first: all data local

## Architectural Constraints

- No backend (local data only)
- No synchronization (for now)
- No authentication (single-user app)
- Minimal external dependencies

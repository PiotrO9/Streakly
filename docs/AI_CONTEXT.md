# AI / Code Assistant Instructions

## Project Context

You are an AI assistant helping develop **Streakly** - an offline-first mobile app for tracking addiction recovery.

## How to Generate Code

### 1. Follow Architecture

- **Domain layer**: Pure logic, no RN dependencies
- **Data layer**: Repository pattern, SQLite abstraction
- **Presentation layer**: React Native components

### 2. Use Existing Patterns

- Check existing files before creating new ones
- Use same naming conventions
- Maintain directory structure

### 3. TypeScript First

- Always define types
- Use interfaces for domain models
- Avoid `any` - use `unknown` if type unknown

### 4. Offline-First Mindset

- All operations local
- No API calls (for now)
- SQLite as source of truth

## What to Do

✅ **DO**:
- Create components in appropriate directories
- Use existing utilities (`date.ts`, `format.ts`)
- Implement business logic in services
- Use Repository for data access
- Add types for all functions/props
- Check existing components before creating new ones

❌ **DON'T**:
- Don't create backend calls
- Don't add unnecessary dependencies
- Don't mix layers (e.g., SQL in component)
- Don't hardcode values (use constants)
- Don't skip types
- Don't duplicate existing code

## Response Structure

When generating code:

1. **Check context**: Does similar code already exist?
2. **Use patterns**: Repository, Service, Component
3. **Add types**: All parameters and return values
4. **Maintain consistency**: Naming, file structure

## Examples

### Creating New Component

```typescript
// src/components/ui/NewComponent.tsx
import { View, Text } from 'react-native';
import { styles } from './styles';

interface NewComponentProps {
  title: string;
  onPress: () => void;
}

export function NewComponent({ title, onPress }: NewComponentProps) {
  return (
    <View style={styles.container}>
      <Text>{title}</Text>
    </View>
  );
}
```

### Creating New Service

```typescript
// src/domain/services/NewService.ts
import type { Streak } from '../models/Streak';

export class NewService {
  static doSomething(streak: Streak): number {
    // Business logic
    return 0;
  }
}
```

### Creating New Repository

```typescript
// src/data/repositories/NewRepository.ts
import type { Entity } from '@/domain/models/Entity';

export class NewRepository {
  async findAll(): Promise<Entity[]> {
    // SQLite query
    return [];
  }
}
```

## Questions to Ask

When uncertain:

1. **Check documentation**: `ARCHITECTURE.md`, `DOMAIN.md`
2. **See examples**: Existing files in project
3. **Ask**: If context unclear

## Priorities

1. **Functionality**: Code must work
2. **Types**: Full TypeScript typing
3. **Architecture**: Follow layers
4. **Readability**: Code easy to understand
5. **Consistency**: Match existing code

## MVP Focus

- **Simplicity**: Avoid overengineering
- **Working**: Better working simple code than complex
- **Iteration**: Can improve later
- **Offline**: Everything local

## Language

- **Code**: English (names, comments)
- **Documentation**: English (for developer)
- **UI**: English (user-facing text)

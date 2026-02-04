# Coding Standards

## General Principles

### TypeScript

- **Strict mode**: Enabled
- **Types**: Always define types, avoid `any`
- **Interfaces**: Prefer `interface` for objects
- **Type inference**: Use when type is obvious

### React Native / Expo

- **Composition API**: N/A (React Native uses functions)
- **Hooks**: Prefer hooks over classes
- **Functional Components**: Functional components only

## Naming Conventions

### Files and Directories

- **Components**: PascalCase (`Button.tsx`, `HomeScreen.tsx`)
- **Utilities**: camelCase (`date.ts`, `format.ts`)
- **Services**: PascalCase (`StreakService.ts`)
- **Repositories**: PascalCase (`StreakRepository.ts`)
- **Directories**: camelCase (`screens/`, `components/`)

### Variables and Functions

- **Variables**: camelCase (`currentCount`, `startDate`)
- **Functions**: camelCase (`calculateDays`, `findById`)
- **Classes**: PascalCase (`StreakService`, `StreakRepository`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_STREAK_NAME_LENGTH`)
- **Event handlers**: Prefix `handle` (`handlePress`, `handleSubmit`)

### Components

- **Props interfaces**: `ComponentNameProps` (`ButtonProps`)
- **Export**: Named exports (preferred over default)

## Code Structure

### Components

```typescript
// 1. Imports (external, internal)
// 2. Types/Interfaces
// 3. Component
// 4. Styles (if StyleSheet)
```

### Services / Repositories

```typescript
// 1. Imports
// 2. Class definition
// 3. Static methods (if service)
// 4. Instance methods
```

## Styling

### React Native StyleSheet

- Use `StyleSheet.create()` instead of inline styles
- Styles at end of file
- Style names: camelCase (`buttonContainer`, `textPrimary`)

### Colors and Constants

- Colors in `src/constants/colors.ts`
- Don't hardcode colors in components
- Use constants from `constants/`

## Error Handling

- **Try-catch**: In async operations
- **Error handling**: In repository methods
- **Validation**: In service layer
- **User feedback**: Show errors to user

## Comments

- **Language**: English in code, English in documentation
- **Comments**: Only when code is not obvious
- **JSDoc**: For public functions/classes

## Imports

- **Order**: 
  1. External libraries
  2. Internal absolute imports (`@/`)
  3. Relative imports
- **Grouping**: Empty lines between groups

## Testing (Future)

- Unit tests: Domain services, utilities
- Integration tests: Repositories
- Component tests: UI components

## Linting and Formatting

- **ESLint**: Expo configuration
- **Prettier**: Auto-formatting
- **Pre-commit**: Format check (future)

## DRY Principles

- **Duplication**: Avoid repeating logic
- **Utilities**: Common logic in `utils/`
- **Constants**: Common values in `constants/`
- **Components**: Reusable UI in `components/ui/`

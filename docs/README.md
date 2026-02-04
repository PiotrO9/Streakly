# Streakly

Offline-first mobile app for tracking habits and addiction recovery streaks.

## App Purpose

Streakly helps users track their progress in fighting addictions by:
- Counting days without relapse (streak)
- Visualizing progress
- Local data storage (offline-first)
- Simple, minimalist interface

## Technologies

- **Framework**: Expo ~54.0
- **Runtime**: React Native 0.81.5, React 19.1.0
- **Language**: TypeScript 5.9
- **Database**: SQLite (local)
- **Architecture**: Clean Architecture / Domain-Driven Design

## Project Status

MVP in development. App works offline, no backend.

## Project Structure

```
mobile/src/
├── app/              # Entry point, navigation
├── components/       # Reusable UI components
├── screens/          # Screen components
├── domain/           # Business logic, models, services
├── data/             # Data access, repositories, database
├── utils/            # Utility functions
└── constants/        # App constants
```

## Principles

- Solo developer
- AI-first workflow
- MVP focus
- Avoid overengineering
- Documentation as AI context

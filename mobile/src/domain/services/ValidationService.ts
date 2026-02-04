// Validation business logic

export class ValidationService {
  static validateStreakName(name: string): boolean {
    return name.trim().length > 0 && name.length <= 50;
  }
}

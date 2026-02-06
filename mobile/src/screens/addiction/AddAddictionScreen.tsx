import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import type { RootStackNavigationProp } from '@/app/navigation/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { COLORS } from '@/constants/colors';
import { DatabaseError } from '@/data/database/db';
import { AddictionRepository } from '@/data/repositories';
import type { Addiction } from '@/domain/models/Addiction';
import { useNavigation } from '@react-navigation/native';

/**
 * Form state shape for Add Addiction screen
 * Extensible structure ready for additional fields
 */
interface AddictionFormState {
  name: string;
}

/**
 * Add Addiction screen - UI skeleton for adding a new addiction
 * Handles form submission and persistence to SQLite database
 */
export function AddAddictionScreen() {
  const navigation = useNavigation<RootStackNavigationProp<'AddAddiction'>>();
  const repository = new AddictionRepository();

  // Form state management
  const [formState, setFormState] = useState<AddictionFormState>({
    name: '',
  });

  // Loading state for async operations
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed property: submit readiness
  // Ready when name field has non-empty trimmed value and not currently submitting
  const isSubmitReady = formState.name.trim().length > 0 && !isSubmitting;

  /**
   * Web-only: Saves addiction to localStorage
   * Used as fallback when SQLite is not available (web platform)
   */
  function saveAddictionToWebStorage(addiction: Addiction): void {
    if (Platform.OS !== 'web' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem('streakly_addictions');
      const existing = stored ? (JSON.parse(stored) as Addiction[]) : [];
      const updated = [...existing, addiction];
      localStorage.setItem('streakly_addictions', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  /**
   * Handle input change for addiction name field
   * Updates form state with new value
   */
  function handleNameChange(value: string): void {
    setFormState((prev) => ({
      ...prev,
      name: value,
    }));
  }

  /**
   * Handle form submission
   * Creates Addiction domain object and persists to database
   */
  async function handleSubmit(): Promise<void> {
    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Construct domain object from form state
      const now = new Date();
      const addiction = await repository.create({
        name: formState.name.trim(),
        createdAt: now,
        lastResetAt: now, // For new addiction, lastResetAt equals createdAt
        longestStreakDays: 0,
        resetCount: 0,
        isArchived: false,
      });

      // Success - log for debugging (can be removed in production)
      console.log('Addiction created successfully:', addiction.id);

      // Navigate back to dashboard
      // Dashboard will automatically refresh via useFocusEffect
      navigation.goBack();
    } catch (error) {
      // Handle database errors - check if it's web stub error
      const isWebStubError =
        error instanceof DatabaseError &&
        error.message.includes('SQLite is not supported in this web stub');

      if (isWebStubError && Platform.OS === 'web') {
        // Fallback to localStorage for web platform
        console.log('[AddAddiction] Using localStorage fallback for web platform');
        const now = new Date();
        const addiction: Addiction = {
          id: `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: formState.name.trim(),
          createdAt: now,
          lastResetAt: now,
          longestStreakDays: 0,
          resetCount: 0,
          isArchived: false,
        };

        saveAddictionToWebStorage(addiction);
        console.log('Addiction saved to localStorage:', addiction.id);

        // Navigate back to dashboard
        navigation.goBack();
      } else if (error instanceof DatabaseError) {
        console.error('Database error creating addiction:', error.message);
        // TODO: Show user-friendly error message (e.g., Alert or toast)
      } else {
        console.error('Unexpected error creating addiction:', error);
        // TODO: Show generic error message to user
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Add Addiction</Text>
        <Text style={styles.subtitle}>
          Enter the name of the addiction you want to track
        </Text>

        <View style={styles.form}>
          <Input
            label="Addiction name"
            placeholder="e.g., Smoking, Alcohol, Social Media"
            value={formState.name}
            onChangeText={handleNameChange}
            accessibilityLabel="Addiction name input"
            autoFocus
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Add"
              onPress={handleSubmit}
              disabled={!isSubmitReady}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 32,
  },
  form: {
    gap: 20,
  },
  buttonContainer: {
    marginTop: 8,
  },
});

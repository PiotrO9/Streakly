import { useCallback, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { RootStackNavigationProp } from '@/app/navigation/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { COLORS } from '@/constants/colors';
import { ROUTES } from '@/constants/routes';
import { DatabaseError } from '@/data/database/db';
import { AddictionRepository } from '@/data/repositories';
import type { Addiction } from '@/domain/models/Addiction';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

/**
 * Dashboard screen - displays list of tracked addictions
 * Fetches data from SQLite repository and refreshes on screen focus
 */
export function DashboardScreen() {
  const navigation = useNavigation<RootStackNavigationProp<'Dashboard'>>();
  const repository = new AddictionRepository();

  const [addictions, setAddictions] = useState<Addiction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Web-only: Loads addictions from localStorage
   * Used as fallback when SQLite is not available (web platform)
   */
  function loadAddictionsFromWebStorage(): Addiction[] {
    if (Platform.OS !== 'web' || typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem('streakly_addictions');
      if (!stored) {
        return [];
      }
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Fetches addictions from repository
   * Called on initial mount and when screen comes into focus
   * Falls back to localStorage on web platform when SQLite is unavailable
   */
  async function fetchAddictions(): Promise<void> {
    setIsLoading(true);
    setError(null);

    try {
      const data = await repository.findAll();
      setAddictions(data);
    } catch (err) {
      // Check if error is due to web stub (SQLite not available on web)
      const isWebStubError =
        err instanceof DatabaseError &&
        err.message.includes('SQLite is not supported in this web stub');

      if (isWebStubError && Platform.OS === 'web') {
        // Fallback to localStorage for web platform
        console.log('[Dashboard] Using localStorage fallback for web platform');
        const webData = loadAddictionsFromWebStorage();
        setAddictions(webData);
      } else {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error('Failed to fetch addictions:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Refetch data when screen comes into focus
   * This ensures the list updates after returning from Add Addiction screen
   */
  useFocusEffect(
    useCallback(() => {
      fetchAddictions();
    }, [])
  );

  function handleNavigateToAdd() {
    navigation.navigate(ROUTES.ADD_ADDICTION);
  }

  function handleAddictionPress(addiction: Addiction) {
    // TODO: Navigate to addiction detail screen
    console.log('Pressed addiction:', addiction.id);
  }

  function renderAddictionItem({ item }: { item: Addiction }) {
    return (
      <TouchableOpacity
        onPress={() => handleAddictionPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`View ${item.name} addiction`}
      >
        <Card style={styles.addictionCard}>
          <Text style={styles.addictionName}>{item.name}</Text>
          <Text style={styles.addictionStreak}>
            {item.longestStreakDays} days streak
          </Text>
        </Card>
      </TouchableOpacity>
    );
  }

  function renderEmptyState() {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>No addictions tracked</Text>
        <Text style={styles.emptyStateText}>
          Start tracking your recovery journey by adding your first addiction.
        </Text>
        <Button title="Add Addiction" onPress={handleNavigateToAdd} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Addictions</Text>
        <TouchableOpacity
          onPress={handleNavigateToAdd}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel="Add new addiction"
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Failed to load addictions</Text>
          <Button title="Retry" onPress={fetchAddictions} />
        </View>
      ) : addictions.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={addictions}
          renderItem={renderAddictionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.surface,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  addictionCard: {
    marginBottom: 12,
  },
  addictionName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  addictionStreak: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  loadingState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  errorState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    color: COLORS.error || COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
});

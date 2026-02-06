import { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  type AppStateStatus,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { RootStackNavigationProp } from '@/app/navigation/types';
import { executeResetFlow } from '@/application/reset/ResetFlowExample';
import { AddictionCard } from '@/components/addiction/AddictionCard';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/colors';
import { ROUTES } from '@/constants/routes';
import { DatabaseError } from '@/data/database/db';
import { AddictionRepository } from '@/data/repositories';
import type { Addiction } from '@/domain/models/Addiction';
import { resetAddictionStreak } from '@/domain/services/AddictionResetService';
import { StreakService } from '@/domain/services/StreakService';
import { formatElapsedTime, normalizeToDate } from '@/utils/date';
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
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  /**
   * Web-only: Loads addictions from localStorage
   * Used as fallback when SQLite is not available (web platform)
   * Converts JSON-serialized dates back to Date objects
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
      if (!Array.isArray(parsed)) {
        return [];
      }

      // Convert date strings/timestamps back to Date objects
      return parsed.map((item) => ({
        ...item,
        createdAt: normalizeToDate(item.createdAt),
        lastResetAt: normalizeToDate(item.lastResetAt),
        archivedAt: item.archivedAt ? normalizeToDate(item.archivedAt) : undefined,
        sync: item.sync
          ? {
              ...item.sync,
              updatedAt: normalizeToDate(item.sync.updatedAt),
              lastSyncedAt: item.sync.lastSyncedAt
                ? normalizeToDate(item.sync.lastSyncedAt)
                : undefined,
            }
          : undefined,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Web-only: Updates an addiction in localStorage
   * Used as fallback when SQLite is not available (web platform)
   */
  function updateAddictionInWebStorage(updatedAddiction: Addiction): void {
    if (Platform.OS !== 'web' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem('streakly_addictions');
      const existing = stored ? (JSON.parse(stored) as Addiction[]) : [];

      const updatedList = existing.map((item) =>
        item.id === updatedAddiction.id ? updatedAddiction : item
      );

      localStorage.setItem('streakly_addictions', JSON.stringify(updatedList));
    } catch (storageError) {
      console.error('[Dashboard] Failed to update localStorage:', storageError);
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
   * Updates current time and refetches data.
   * Called when app comes to foreground or screen gains focus.
   * Ensures streaks are recalculated with fresh time after app reload or background period.
   */
  function refreshDataAndTime(): void {
    setCurrentTime(new Date());
    void fetchAddictions();
  }

  /**
   * Refetch data when screen comes into focus
   * This ensures the list updates after returning from Add Addiction screen
   */
  useFocusEffect(
    useCallback(() => {
      refreshDataAndTime();
    }, [])
  );

  /**
   * Handle app state changes (background → foreground)
   * Critical for correct streak calculation after app was backgrounded
   * (e.g., app kept in background overnight)
   */
  useEffect(() => {
    function handleAppStateChange(nextAppState: AppStateStatus): void {
      if (nextAppState === 'active') {
        // App came to foreground - recalculate streaks with fresh time
        refreshDataAndTime();
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  /**
   * Update current time to refresh streak display.
   * Updates every minute to show accurate seconds/minutes/hours for streaks < 1 day,
   * and ensures day counts update correctly at midnight.
   */
  useEffect(() => {
    // Update time immediately
    setCurrentTime(new Date());

    // Update every minute to keep seconds/minutes/hours accurate
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60 * 1000); // Every minute

    return () => clearInterval(interval);
  }, []);

  function handleNavigateToAdd() {
    navigation.navigate(ROUTES.ADD_ADDICTION);
  }

  function handleAddictionPress(addiction: Addiction) {
    // TODO: Navigate to addiction detail screen
    console.log('Pressed addiction:', addiction.id);
  }

  /**
   * Handles reset button press for an addiction.
   * Executes the reset flow (domain logic + persistence) and refreshes the UI.
   *
   * Native (iOS/Android):
   * - Uses executeResetFlow (SQLite persistence).
   *
   * Web:
   * - executeResetFlow will throw because SQLite is not supported in the web stub.
   * - We fall back to pure domain logic + localStorage, mirroring AddAddictionScreen.
   */
  async function handleResetPress(addiction: Addiction): Promise<void> {
    try {
      await executeResetFlow(addiction, {
        reason: 'manual',
        note: 'User-initiated reset from dashboard',
      });

      // Success on native platforms: refresh data and update current time
      refreshDataAndTime();
    } catch (error) {
      const isWebStubError =
        error instanceof DatabaseError &&
        error.message.includes('SQLite is not supported in this web stub');

      if (isWebStubError && Platform.OS === 'web') {
        console.log('[Dashboard] Reset fallback to localStorage for web platform');

        const now = new Date();
        const resetId = `web-reset-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const { updatedAddiction } = resetAddictionStreak({
          addiction,
          now,
          resetId,
          reason: 'manual',
          note: 'User-initiated reset (web fallback)',
        });

        // Persist to localStorage (web-only) to keep data consistent across reloads
        updateAddictionInWebStorage(updatedAddiction);

        // Update local state so UI refreshes immediately
        setCurrentTime(now);
        setAddictions((previous) =>
          previous.map((item) => (item.id === updatedAddiction.id ? updatedAddiction : item))
        );

        return;
      }

      // Non-web-stub errors: log and surface to UI
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Dashboard] Reset failed:', errorMessage, error);

      setError(
        error instanceof Error
          ? error
          : new Error(`Failed to reset streak: ${errorMessage}`)
      );
    }
  }

  /**
   * Calculates the effective start date for streak calculation.
   * This mirrors the logic from StreakService to determine the correct start point.
   */
  function getEffectiveStart(addiction: Addiction, now: Date): Date {
    const createdAtTime = addiction.createdAt.getTime();
    const nowTime = now.getTime();

    if (createdAtTime > nowTime) {
      return addiction.createdAt;
    }

    let effectiveStart: Date = addiction.createdAt;

    if (addiction.lastResetAt) {
      const lastResetTime = addiction.lastResetAt.getTime();

      if (lastResetTime <= nowTime) {
        if (lastResetTime > createdAtTime) {
          effectiveStart = addiction.lastResetAt;
        }
      }
    }

    return effectiveStart;
  }

  /**
   * Formats streak display with appropriate units.
   * Shows seconds/minutes/hours when streak < 1 day, days when >= 1 day.
   */
  function formatStreakDisplay(addiction: Addiction, now: Date): string {
    try {
      const streakDays = StreakService.calculateCurrentStreakDaysFromAddiction(
        addiction,
        now
      );

      // If streak is less than 1 day, show detailed time (seconds/minutes/hours)
      if (streakDays === 0) {
        const effectiveStart = getEffectiveStart(addiction, now);
        return formatElapsedTime(effectiveStart, now);
      }

      // If streak is 1+ days, show days
      if (streakDays === 1) {
        return '1 day';
      }
      return `${streakDays} days`;
    } catch (error) {
      console.error(`Failed to calculate streak for ${addiction.id}:`, error);
      return '—';
    }
  }

  function renderAddictionItem({ item }: { item: Addiction }) {
    const streakLabel = formatStreakDisplay(item, currentTime);

    return (
      <AddictionCard
        name={item.name}
        streakLabel={streakLabel}
        onPress={() => handleAddictionPress(item)}
        onResetPress={() => handleResetPress(item)}
      />
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

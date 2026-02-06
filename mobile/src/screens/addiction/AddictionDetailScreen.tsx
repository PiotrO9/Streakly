import { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  type AppStateStatus,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import type { RootStackScreenProps } from '@/app/navigation/types';
import { TimeCounter } from '@/components/addiction/TimeCounter';
import { BottomNavigation, type BottomTab } from '@/components/layout/BottomNavigation';
import { COLORS } from '@/constants/colors';
import { DatabaseError } from '@/data/database/db';
import { AddictionRepository } from '@/data/repositories';
import type { Addiction } from '@/domain/models/Addiction';
import { normalizeToDate } from '@/utils/date';
import { calculateElapsedTimeBreakdown } from '@/utils/date';
import { useFocusEffect } from '@react-navigation/native';

interface AddictionDetailScreenProps extends RootStackScreenProps<'AddictionDetail'> {}

/**
 * Addiction Detail screen - displays detailed view of a single addiction
 * Shows real-time counter (days, hours, minutes, seconds) and bottom navigation
 */
export function AddictionDetailScreen({ route, navigation }: AddictionDetailScreenProps) {
  const { addictionId } = route.params;
  console.log('[AddictionDetail] Screen loaded with addictionId:', addictionId);
  const repository = new AddictionRepository();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [addiction, setAddiction] = useState<Addiction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<BottomTab>('Addiction');

  /**
   * Web-only: Loads addiction from localStorage
   */
  function loadAddictionFromWebStorage(id: string): Addiction | null {
    if (Platform.OS !== 'web' || typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const stored = localStorage.getItem('streakly_addictions');
      if (!stored) {
        return null;
      }
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return null;
      }

      const found = parsed.find((item: Addiction) => item.id === id);
      if (!found) {
        return null;
      }

      return {
        ...found,
        createdAt: normalizeToDate(found.createdAt),
        lastResetAt: normalizeToDate(found.lastResetAt),
        archivedAt: found.archivedAt ? normalizeToDate(found.archivedAt) : undefined,
        sync: found.sync
          ? {
              ...found.sync,
              updatedAt: normalizeToDate(found.sync.updatedAt),
              lastSyncedAt: found.sync.lastSyncedAt
                ? normalizeToDate(found.sync.lastSyncedAt)
                : undefined,
            }
          : undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * Fetches addiction from repository
   */
  async function fetchAddiction(): Promise<void> {
    setIsLoading(true);
    setError(null);

    try {
      const data = await repository.findById(addictionId);
      if (data) {
        setAddiction(data);
      } else {
        setError(new Error('Addiction not found'));
      }
    } catch (err) {
      const isWebStubError =
        err instanceof DatabaseError &&
        err.message.includes('SQLite is not supported in this web stub');

      if (isWebStubError && Platform.OS === 'web') {
        const webData = loadAddictionFromWebStorage(addictionId);
        if (webData) {
          setAddiction(webData);
        } else {
          setError(new Error('Addiction not found'));
        }
      } else {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error('Failed to fetch addiction:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Updates current time and refetches data
   */
  function refreshDataAndTime(): void {
    setCurrentTime(new Date());
    void fetchAddiction();
  }

  /**
   * Refetch data when screen comes into focus
   */
  useFocusEffect(
    useCallback(() => {
      refreshDataAndTime();
    }, [addictionId])
  );

  /**
   * Handle app state changes (background → foreground)
   */
  useEffect(() => {
    function handleAppStateChange(nextAppState: AppStateStatus): void {
      if (nextAppState === 'active') {
        refreshDataAndTime();
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  /**
   * Update current time every second for real-time counter
   */
  useEffect(() => {
    setCurrentTime(new Date());

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  function handleTabChange(tab: BottomTab): void {
    setActiveTab(tab);
  }

  function handleBackPress(): void {
    navigation.goBack();
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error || !addiction) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Failed to load addiction</Text>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const timeBreakdown = calculateElapsedTimeBreakdown(addiction.lastResetAt, currentTime);

  return (
    <View style={styles.container}>
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.menuButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>> {addiction.name}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        <TimeCounter breakdown={timeBreakdown} addictionName={addiction.name} />
      </ScrollView>

      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.addictionBackground,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerDesktop: {
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 16,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  menuButton: {
    padding: 8,
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 20,
    color: COLORS.addictionText,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.addictionText,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  scrollContentDesktop: {
    paddingBottom: 120,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.addictionText,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});

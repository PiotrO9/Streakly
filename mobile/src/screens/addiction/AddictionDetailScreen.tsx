import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import { BurgerMenu } from '@/components/layout/BurgerMenu';
import { COLORS } from '@/constants/colors';
import { ROUTES } from '@/constants/routes';
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
  const [addictions, setAddictions] = useState<Addiction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<BottomTab>('Addictions');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-280)).current;

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
   * Fetches addictions from repository
   * Called on initial mount and when screen comes into focus
   * Falls back to localStorage on web platform when SQLite is unavailable
   */
  async function fetchAddictions(): Promise<void> {
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
        console.log('[AddictionDetail] Using localStorage fallback for web platform');
        const webData = loadAddictionsFromWebStorage();
        setAddictions(webData);
      } else {
        console.error('Failed to fetch addictions:', err);
      }
    }
  }

  /**
   * Updates current time and refetches data
   */
  function refreshDataAndTime(): void {
    setCurrentTime(new Date());
    void fetchAddiction();
    void fetchAddictions();
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

  function handleMenuToggle(): void {
    if (!isMenuOpen) {
      setIsMenuOpen(true);
      // Reset animation value based on current menu width
      const menuWidthValue = isDesktop ? 320 : 280;
      slideAnim.setValue(-menuWidthValue);
      // Animate menu sliding in from left
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      handleMenuClose();
    }
  }

  function handleMenuClose(): void {
    const menuWidthValue = isDesktop ? 320 : 280;
    // Animate menu sliding out to left
    Animated.timing(slideAnim, {
      toValue: -menuWidthValue,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsMenuOpen(false);
    });
  }

  function handleAddictionSelect(selectedAddictionId: string): void {
    if (selectedAddictionId !== addictionId) {
      navigation.replace(ROUTES.ADDICTION_DETAIL, { addictionId: selectedAddictionId });
    }
    handleMenuClose();
  }

  function handleNavigateToAdd(): void {
    navigation.navigate(ROUTES.ADD_ADDICTION);
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const timeBreakdown = calculateElapsedTimeBreakdown(addiction.lastResetAt, currentTime);

  // Filter only active (non-archived) addictions
  const activeAddictions = addictions.filter((addiction) => !addiction.isArchived);

  return (
    <View style={styles.container}>
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <TouchableOpacity
          onPress={handleMenuToggle}
          style={styles.menuButton}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{addiction.name}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        <TimeCounter breakdown={timeBreakdown} addictionName={addiction.name} />
      </ScrollView>

      {/* Burger Menu */}
      <BurgerMenu
        visible={isMenuOpen}
        addictions={activeAddictions}
        currentTime={currentTime}
        selectedAddictionId={addictionId}
        slideAnim={slideAnim}
        onClose={handleMenuClose}
        onAddictionSelect={handleAddictionSelect}
        onNavigateToAdd={handleNavigateToAdd}
        showAddButton={true}
      />

      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
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
    color: COLORS.text,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
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
    color: COLORS.text,
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

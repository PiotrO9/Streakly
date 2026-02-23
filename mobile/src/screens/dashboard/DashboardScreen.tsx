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

import type { RootStackNavigationProp } from '@/app/navigation/types';
import { TimeCounter } from '@/components/addiction/TimeCounter';
import { BottomNavigation, type BottomTab } from '@/components/layout/BottomNavigation';
import { BurgerMenu } from '@/components/layout/BurgerMenu';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import { ROUTES } from '@/constants/routes';
import { DatabaseError } from '@/data/database/db';
import { AddictionRepository } from '@/data/repositories';
import type { Addiction } from '@/domain/models/Addiction';
import { normalizeToDate } from '@/utils/date';
import { calculateElapsedTimeBreakdown } from '@/utils/date';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

/**
 * Dashboard screen - displays main view with time counter and bottom navigation
 * Shows the first addiction's time counter as the main view
 */
export function DashboardScreen() {
  const navigation = useNavigation<RootStackNavigationProp<'Dashboard'>>();
  const repository = new AddictionRepository();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [addictions, setAddictions] = useState<Addiction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<BottomTab>('Addictions');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedAddictionId, setSelectedAddictionId] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(-280)).current;

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
      return parsed.map(item => ({
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

      const updatedList = existing.map(item =>
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
   * Update current time every second for real-time counter
   */
  useEffect(() => {
    setCurrentTime(new Date());

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  function handleNavigateToAdd() {
    navigation.navigate(ROUTES.ADD_ADDICTION);
  }

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

  function handleAddictionSelect(addictionId: string): void {
    setSelectedAddictionId(addictionId);
    setIsMenuOpen(false);
  }

  function handleAddictionPress(addictionId: string): void {
    navigation.navigate(ROUTES.ADDICTION_DETAIL, { addictionId });
  }

  // Filter only active (non-archived) addictions
  const activeAddictions = addictions.filter(addiction => !addiction.isArchived);

  // Get the selected addiction or the first one as default
  const activeAddiction =
    activeAddictions.find(addiction => addiction.id === selectedAddictionId) ||
    (activeAddictions.length > 0 ? activeAddictions[0] : null);

  // Update selected addiction when addictions change (e.g., after adding new one)
  useEffect(() => {
    if (activeAddictions.length > 0) {
      // If no selection or selected addiction is not in the list, select the first one
      if (
        !selectedAddictionId ||
        !activeAddictions.find(addiction => addiction.id === selectedAddictionId)
      ) {
        setSelectedAddictionId(activeAddictions[0].id);
      }
    }
  }, [activeAddictions, selectedAddictionId]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Failed to load addictions</Text>
        <Button title="Retry" onPress={fetchAddictions} />
      </View>
    );
  }

  if (!activeAddiction) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.emptyStateTitle}>No addictions tracked</Text>
        <Text style={styles.emptyStateText}>
          Start tracking your recovery journey by adding your first addiction.
        </Text>
        <Button title="Add Addiction" onPress={handleNavigateToAdd} />
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      </View>
    );
  }

  const timeBreakdown = calculateElapsedTimeBreakdown(activeAddiction.lastResetAt, currentTime);

  return (
    <View style={styles.container}>
      <View style={[styles.headerOuter, isDesktop && styles.headerOuterDesktop]}>
        <View style={[styles.headerInner, isDesktop && styles.headerInnerDesktop]}>
          <TouchableOpacity
            onPress={handleMenuToggle}
            style={styles.menuButton}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{activeAddiction.name}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main time counter for selected addiction */}
        <TimeCounter breakdown={timeBreakdown} addictionName={activeAddiction.name} />
      </ScrollView>

      {/* Burger Menu */}
      <BurgerMenu
        visible={isMenuOpen}
        addictions={activeAddictions}
        currentTime={currentTime}
        selectedAddictionId={selectedAddictionId}
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
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    padding: 8,
  },
  addButtonText: {
    color: COLORS.text,
    fontFamily: FONTS.light,
    fontSize: 24,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  emptyStateText: {
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyStateTitle: {
    color: COLORS.text,
    fontFamily: FONTS.semiBold,
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    marginBottom: 16,
  },
  headerInner: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerInnerDesktop: {
    alignSelf: 'center',
    maxWidth: 800,
    paddingBottom: 16,
    paddingHorizontal: 40,
    paddingTop: 24,
    width: '100%',
  },
  headerOuter: {
    backgroundColor: COLORS.background,
    borderBottomColor: COLORS.border || '#E0E0E0',
    borderBottomWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerOuterDesktop: {
    width: '100%',
  },
  headerRight: {
    width: 40,
  },
  headerTitle: {
    color: COLORS.text,
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: 20,
    letterSpacing: 0.5,
    textTransform: 'capitalize',
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 16,
  },
  menuButton: {
    marginRight: 12,
    padding: 8,
  },
  menuIcon: {
    color: COLORS.text,
    fontSize: 20,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  scrollContentDesktop: {
    alignSelf: 'center',
    maxWidth: 800,
    paddingBottom: 120,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
});

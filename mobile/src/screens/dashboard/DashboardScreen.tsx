import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  type AppStateStatus,
  Modal,
  Platform,
  Pressable,
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
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/colors';
import { ROUTES } from '@/constants/routes';
import { DatabaseError } from '@/data/database/db';
import { AddictionRepository } from '@/data/repositories';
import type { Addiction } from '@/domain/models/Addiction';
import { StreakService } from '@/domain/services/StreakService';
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
  const [activeTab, setActiveTab] = useState<BottomTab>('Addiction');
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

  /**
   * Formats streak days as a readable label
   * @param days - Number of streak days
   * @returns Formatted string like "1 day" or "5 days"
   */
  function formatStreakDays(days: number): string {
    if (days === 1) {
      return '1 day';
    }
    return `${days} days`;
  }

  // Filter only active (non-archived) addictions
  const activeAddictions = addictions.filter((addiction) => !addiction.isArchived);

  // Get the selected addiction or the first one as default
  const activeAddiction =
    activeAddictions.find((addiction) => addiction.id === selectedAddictionId) ||
    (activeAddictions.length > 0 ? activeAddictions[0] : null);

  // Update selected addiction when addictions change (e.g., after adding new one)
  useEffect(() => {
    if (activeAddictions.length > 0) {
      // If no selection or selected addiction is not in the list, select the first one
      if (
        !selectedAddictionId ||
        !activeAddictions.find((addiction) => addiction.id === selectedAddictionId)
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
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <TouchableOpacity
          onPress={handleMenuToggle}
          style={styles.menuButton}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{'>'} {activeAddiction.name}</Text>
        <TouchableOpacity
          onPress={handleNavigateToAdd}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel="Add new addiction"
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main time counter for selected addiction */}
        <TimeCounter breakdown={timeBreakdown} addictionName={activeAddiction.name} />
      </ScrollView>

      {/* Burger Menu Modal */}
      <Modal
        visible={isMenuOpen}
        transparent
        animationType="none"
        onRequestClose={handleMenuClose}
      >
        <View style={styles.menuOverlay}>
          <Pressable
            style={styles.menuOverlayBackdrop}
            onPress={handleMenuClose}
          />
          <Animated.View
            style={[
              styles.menuContent,
              isDesktop && styles.menuContentDesktop,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>My Addictions</Text>
              <TouchableOpacity
                onPress={handleMenuClose}
                style={styles.menuCloseButton}
                accessibilityRole="button"
                accessibilityLabel="Close menu"
              >
                <Text style={styles.menuCloseIcon}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.menuScrollView} showsVerticalScrollIndicator={false}>
              {activeAddictions.map((addiction) => {
                const streakDays = StreakService.calculateCurrentStreakDaysFromAddiction(
                  addiction,
                  currentTime,
                );
                const streakLabel = formatStreakDays(streakDays);
                const isSelected = addiction.id === selectedAddictionId;

                return (
                  <TouchableOpacity
                    key={addiction.id}
                    onPress={() => handleAddictionSelect(addiction.id)}
                    style={[
                      styles.menuItem,
                      isSelected && styles.menuItemSelected,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${addiction.name}, ${streakLabel}`}
                  >
                    <View style={styles.menuItemContent}>
                      <Text
                        style={[
                          styles.menuItemName,
                          isSelected && styles.menuItemNameSelected,
                        ]}
                      >
                        {addiction.name}
                      </Text>
                      <Text
                        style={[
                          styles.menuItemStreak,
                          isSelected && styles.menuItemStreakSelected,
                        ]}
                      >
                        {streakLabel}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => {
                  handleMenuClose();
                  handleNavigateToAdd();
                }}
                style={styles.menuAddButton}
                accessibilityRole="button"
                accessibilityLabel="Add new addiction"
              >
                <Text style={styles.menuAddButtonText}>+ Add New Addiction</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

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
  addButton: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: COLORS.addictionText,
    fontWeight: '300',
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
  menuOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  menuOverlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContent: {
    backgroundColor: COLORS.addictionBackground,
    width: 280,
    height: '100%',
    paddingTop: 16,
    borderRadius: 0,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  menuContentDesktop: {
    width: 320,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || 'rgba(255, 255, 255, 0.1)',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.addictionText,
  },
  menuCloseButton: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCloseIcon: {
    fontSize: 28,
    color: COLORS.addictionText,
    fontWeight: '300',
    lineHeight: 28,
  },
  menuScrollView: {
    maxHeight: 400,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || 'rgba(255, 255, 255, 0.05)',
  },
  menuItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.addictionText,
    flex: 1,
  },
  menuItemNameSelected: {
    fontWeight: '600',
    color: COLORS.primary || '#3B82F6',
  },
  menuItemStreak: {
    fontSize: 14,
    color: COLORS.textSecondary || 'rgba(255, 255, 255, 0.6)',
    marginLeft: 12,
  },
  menuItemStreakSelected: {
    color: COLORS.primary || '#3B82F6',
  },
  menuAddButton: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.primary || '#3B82F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  menuAddButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface || '#FFFFFF',
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
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.addictionText,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.addictionText,
    marginBottom: 24,
    textAlign: 'center',
  },
});

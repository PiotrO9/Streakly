import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import type { RootStackNavigationProp } from '@/app/navigation/types';
import { BurgerMenu } from '@/components/layout/BurgerMenu';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { COLORS } from '@/constants/colors';
import { ROUTES } from '@/constants/routes';
import { DatabaseError } from '@/data/database/db';
import { AddictionRepository } from '@/data/repositories';
import type { Addiction } from '@/domain/models/Addiction';
import { normalizeToDate } from '@/utils/date';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Form state management
  const [formState, setFormState] = useState<AddictionFormState>({
    name: '',
  });

  // Loading state for async operations
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Menu state
  const [addictions, setAddictions] = useState<Addiction[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-280)).current;

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
        console.log('[AddAddiction] Using localStorage fallback for web platform');
        const webData = loadAddictionsFromWebStorage();
        setAddictions(webData);
      } else {
        console.error('Failed to fetch addictions:', err);
      }
    }
  }

  /**
   * Updates current time for streak calculations
   */
  function refreshDataAndTime(): void {
    setCurrentTime(new Date());
    void fetchAddictions();
  }

  /**
   * Refetch data when screen comes into focus
   */
  useFocusEffect(
    useCallback(() => {
      refreshDataAndTime();
    }, [])
  );

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

  /**
   * Handle input change for addiction name field
   * Updates form state with new value
   */
  function handleNameChange(value: string): void {
    setFormState(prev => ({
      ...prev,
      name: value,
    }));
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
    handleMenuClose();
    navigation.navigate(ROUTES.ADDICTION_DETAIL, { addictionId });
  }

  function handleNavigateToDashboard(): void {
    navigation.navigate(ROUTES.DASHBOARD);
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

  // Filter only active (non-archived) addictions
  const activeAddictions = addictions.filter(addiction => !addiction.isArchived);

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
          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.subtitle}>Enter the name of the addiction you want to track</Text>

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
              <Button title="Add" onPress={handleSubmit} disabled={!isSubmitReady} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Burger Menu */}
      <BurgerMenu
        visible={isMenuOpen}
        addictions={activeAddictions}
        currentTime={currentTime}
        selectedAddictionId={null}
        slideAnim={slideAnim}
        onClose={handleMenuClose}
        onAddictionSelect={handleAddictionSelect}
        onNavigateToDashboard={handleNavigateToDashboard}
        onNavigateToAdd={undefined}
        showAddButton={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 8,
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  form: {
    gap: 20,
  },
  headerInner: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
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
    backgroundColor: COLORS.surface,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerOuterDesktop: {
    width: '100%',
  },
  headerRight: {
    width: 40,
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
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 32,
  },
});

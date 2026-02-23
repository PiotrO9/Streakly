import { useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import type { RootStackNavigationProp } from '@/app/navigation/types';
import { COLORS } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import { DatabaseError } from '@/data/database/db';
import { AddictionRepository } from '@/data/repositories';
import type { Addiction } from '@/domain/models/Addiction';
import { useNavigation } from '@react-navigation/native';

interface PredefinedAddiction {
  name: string;
  icon: string;
}

const PREDEFINED_ADDICTIONS: PredefinedAddiction[] = [
  { name: 'Alcohol', icon: '🍺' },
  { name: 'Smoking', icon: '🚬' },
  { name: 'Drugs', icon: '💊' },
  { name: 'Gambling', icon: '🎰' },
  { name: 'Social Media', icon: '📱' },
  { name: 'Pornography', icon: '🔞' },
  { name: 'Sweets', icon: '🍬' },
  { name: 'Fast Food', icon: '🍔' },
  { name: 'Coffee', icon: '☕' },
  { name: 'Video Games', icon: '🎮' },
  { name: 'Shopping', icon: '🛍️' },
  { name: 'Netflix', icon: '📺' },
  { name: 'Energy Drinks', icon: '⚡' },
  { name: 'Nail Biting', icon: '💅' },
  { name: 'Procrastination', icon: '⏰' },
];

export function AddAddictionScreen() {
  const navigation = useNavigation<RootStackNavigationProp<'AddAddiction'>>();
  const repository = new AddictionRepository();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function handleSelectAddiction(name: string): Promise<void> {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date();
      const addiction = await repository.create({
        name,
        createdAt: now,
        lastResetAt: now,
        longestStreakDays: 0,
        resetCount: 0,
        isArchived: false,
      });

      console.log('Addiction created successfully:', addiction.id);
      navigation.goBack();
    } catch (error) {
      const isWebStubError =
        error instanceof DatabaseError &&
        error.message.includes('SQLite is not supported in this web stub');

      if (isWebStubError && Platform.OS === 'web') {
        console.log('[AddAddiction] Using localStorage fallback for web platform');
        const now = new Date();
        const addiction: Addiction = {
          id: `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          createdAt: now,
          lastResetAt: now,
          longestStreakDays: 0,
          resetCount: 0,
          isArchived: false,
        };

        saveAddictionToWebStorage(addiction);
        console.log('Addiction saved to localStorage:', addiction.id);
        navigation.goBack();
      } else if (error instanceof DatabaseError) {
        console.error('Database error creating addiction:', error.message);
      } else {
        console.error('Unexpected error creating addiction:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoBack(): void {
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <View style={[styles.headerOuter, isDesktop && styles.headerOuterDesktop]}>
        <View style={[styles.headerInner, isDesktop && styles.headerInnerDesktop]}>
          <TouchableOpacity
            onPress={handleGoBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Addiction</Text>
        </View>
      </View>

      <View style={styles.listWrapper}>
        <FlatList
          data={PREDEFINED_ADDICTIONS}
          keyExtractor={item => item.name}
          style={StyleSheet.absoluteFill}
          contentContainerStyle={[
            styles.flatListContent,
            isDesktop && styles.flatListContentDesktop,
          ]}
          showsVerticalScrollIndicator
          ListHeaderComponent={
            <Text style={styles.subtitle}>Choose the addiction you want to track</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.addictionItem, isSubmitting && styles.addictionItemDisabled]}
              onPress={() => handleSelectAddiction(item.name)}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel={`Add ${item.name}`}
            >
              <Text style={styles.addictionIcon}>{item.icon}</Text>
              <Text style={styles.addictionName}>{item.name}</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addictionIcon: {
    fontSize: 28,
  },
  addictionItem: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  addictionItemDisabled: {
    opacity: 0.5,
  },
  addictionName: {
    color: COLORS.text,
    fontFamily: FONTS.medium,
    fontSize: 16,
  },
  backButton: {
    marginRight: 12,
    padding: 8,
  },
  backIcon: {
    color: COLORS.text,
    fontSize: 20,
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
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
    borderBottomColor: COLORS.border,
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
  headerTitle: {
    color: COLORS.text,
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: 20,
    letterSpacing: 0.5,
  },
  flatListContent: {
    padding: 20,
    paddingBottom: 100,
  },
  flatListContentDesktop: {
    alignSelf: 'center',
    maxWidth: 800,
    paddingBottom: 120,
    width: '100%',
  },
  listWrapper: {
    flex: 1,
  },
  separator: {
    height: 10,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 32,
  },
});

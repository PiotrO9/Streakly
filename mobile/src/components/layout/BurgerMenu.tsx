import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { COLORS } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import type { Addiction } from '@/domain/models/Addiction';
import { StreakService } from '@/domain/services/StreakService';

export interface BurgerMenuProps {
  visible: boolean;
  addictions: Addiction[];
  currentTime: Date;
  selectedAddictionId?: string | null;
  slideAnim: Animated.Value;
  onClose: () => void;
  onAddictionSelect: (addictionId: string) => void;
  onNavigateToDashboard?: () => void;
  onNavigateToAdd?: () => void;
  showAddButton?: boolean;
}

/**
 * Formats streak days as a readable label
 */
function formatStreakDays(days: number): string {
  if (days === 1) {
    return '1 day';
  }
  return `${days} days`;
}

/**
 * Reusable burger menu component
 * Displays list of addictions with streaks and navigation options
 */
export function BurgerMenu({
  visible,
  addictions,
  currentTime,
  selectedAddictionId,
  slideAnim,
  onClose,
  onAddictionSelect,
  onNavigateToDashboard,
  onNavigateToAdd,
  showAddButton = true,
}: BurgerMenuProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Filter only active (non-archived) addictions
  const activeAddictions = addictions.filter(addiction => !addiction.isArchived);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.menuOverlay}>
        <Pressable style={styles.menuOverlayBackdrop} onPress={onClose} />
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
              onPress={onClose}
              style={styles.menuCloseButton}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
            >
              <Text style={styles.menuCloseIcon}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.menuScrollView} showsVerticalScrollIndicator={false}>
            {onNavigateToDashboard && (
              <TouchableOpacity
                onPress={() => {
                  onNavigateToDashboard();
                  onClose();
                }}
                style={styles.menuItem}
                accessibilityRole="button"
                accessibilityLabel="Go to dashboard"
              >
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemName}>Dashboard</Text>
                </View>
              </TouchableOpacity>
            )}
            {activeAddictions.map(addiction => {
              const streakDays = StreakService.calculateCurrentStreakDaysFromAddiction(
                addiction,
                currentTime
              );
              const streakLabel = formatStreakDays(streakDays);
              const isSelected = addiction.id === selectedAddictionId;

              return (
                <TouchableOpacity
                  key={addiction.id}
                  onPress={() => onAddictionSelect(addiction.id)}
                  style={[styles.menuItem, isSelected && styles.menuItemSelected]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${addiction.name}, ${streakLabel}`}
                >
                  <View style={styles.menuItemContent}>
                    <Text style={[styles.menuItemName, isSelected && styles.menuItemNameSelected]}>
                      {addiction.name}
                    </Text>
                    <Text
                      style={[styles.menuItemStreak, isSelected && styles.menuItemStreakSelected]}
                    >
                      {streakLabel}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {showAddButton && onNavigateToAdd && (
              <TouchableOpacity
                onPress={() => {
                  onNavigateToAdd();
                  onClose();
                }}
                style={styles.menuAddButton}
                accessibilityRole="button"
                accessibilityLabel="Add new addiction"
              >
                <Text style={styles.menuAddButtonText}>Add New Addiction</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menuAddButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary || '#3B82F6',
    borderRadius: 6,
    margin: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  menuAddButtonText: {
    color: COLORS.surface || '#FFFFFF',
    fontFamily: FONTS.semiBold,
    fontSize: 14,
  },
  menuCloseButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    padding: 8,
  },
  menuCloseIcon: {
    color: COLORS.text,
    fontFamily: FONTS.light,
    fontSize: 28,
    lineHeight: 28,
  },
  menuContent: {
    backgroundColor: COLORS.background,
    borderRadius: 0,
    height: '100%',
    left: 0,
    paddingTop: 16,
    position: 'absolute',
    top: 0,
    width: 280,
  },
  menuContentDesktop: {
    width: 320,
  },
  menuHeader: {
    alignItems: 'center',
    borderBottomColor: COLORS.border || 'rgba(0, 0, 0, 0.1)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  menuItem: {
    borderBottomColor: COLORS.border || 'rgba(0, 0, 0, 0.05)',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItemContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  menuItemName: {
    color: COLORS.text,
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 16,
  },
  menuItemNameSelected: {
    color: COLORS.primary || '#3B82F6',
    fontFamily: FONTS.semiBold,
  },
  menuItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  menuItemStreak: {
    color: COLORS.textSecondary || 'rgba(0, 0, 0, 0.6)',
    fontSize: 14,
    marginLeft: 12,
  },
  menuItemStreakSelected: {
    color: COLORS.primary || '#3B82F6',
  },
  menuOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  menuOverlayBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
  },
  menuScrollView: {
    maxHeight: 400,
  },
  menuTitle: {
    color: COLORS.text,
    fontFamily: FONTS.semiBold,
    fontSize: 20,
  },
});

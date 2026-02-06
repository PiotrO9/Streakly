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
  const activeAddictions = addictions.filter((addiction) => !addiction.isArchived);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
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
                  onPress={() => onAddictionSelect(addiction.id)}
                  style={[styles.menuItem, isSelected && styles.menuItemSelected]}
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
                <Text style={styles.menuAddButtonText}>+ Add New Addiction</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menuOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  menuOverlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContent: {
    backgroundColor: COLORS.background,
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
    borderBottomColor: COLORS.border || 'rgba(0, 0, 0, 0.1)',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  menuCloseButton: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCloseIcon: {
    fontSize: 28,
    color: COLORS.text,
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
    borderBottomColor: COLORS.border || 'rgba(0, 0, 0, 0.05)',
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
    color: COLORS.text,
    flex: 1,
  },
  menuItemNameSelected: {
    fontWeight: '600',
    color: COLORS.primary || '#3B82F6',
  },
  menuItemStreak: {
    fontSize: 14,
    color: COLORS.textSecondary || 'rgba(0, 0, 0, 0.6)',
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
});

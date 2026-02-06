import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { COLORS } from '@/constants/colors';

interface AddictionCardProps {
  name: string;
  streakLabel?: string;
  onPress?: () => void;
  onResetPress?: () => void;
}

export function AddictionCard({ name, streakLabel, onPress, onResetPress }: AddictionCardProps) {
  const displayStreakLabel = streakLabel ?? '—';

  function handleResetPress() {
    onResetPress?.();
  }

  function handleCardPress() {
    onPress?.();
  }

  // Reset button - wrapped in View to stop event propagation when card is clickable
  // This prevents nested button issue on web (TouchableOpacity renders as <button>)
  const resetButton = onResetPress ? (
    <View
      style={styles.resetButtonWrapper}
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
    >
      <Pressable
        onPress={handleResetPress}
        style={({ pressed }) => [
          styles.resetButton,
          pressed && styles.resetButtonPressed,
        ]}
        // Only set accessibilityRole when card is not clickable to avoid nested buttons
        accessibilityRole={onPress ? undefined : 'button'}
        accessibilityLabel={`Reset streak for ${name}`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.resetButtonText}>Reset</Text>
      </Pressable>
    </View>
  ) : null;

  const cardContent = (
    <Card style={styles.card}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.streak}>{displayStreakLabel}</Text>
        </View>
        {resetButton}
      </View>
    </Card>
  );

  // If card is not clickable, return content as-is
  if (!onPress) {
    return cardContent;
  }

  // If card is clickable, wrap Card in TouchableOpacity
  // The reset button container stops event propagation to prevent nested button issue
  return (
    <TouchableOpacity
      onPress={handleCardPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${name} addiction`}
      activeOpacity={0.7}
    >
      {cardContent}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  streak: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginLeft: 12,
  },
  resetButtonWrapper: {
    marginLeft: 12,
  },
  resetButton: {
    backgroundColor: COLORS.error,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resetButtonPressed: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
});


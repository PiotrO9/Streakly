import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

  const cardContent = (
    <Card style={styles.card}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.streak}>{displayStreakLabel}</Text>
        </View>
        {onResetPress && (
          <TouchableOpacity
            onPress={handleResetPress}
            style={styles.resetButton}
            accessibilityRole="button"
            accessibilityLabel={`Reset streak for ${name}`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  if (!onPress) {
    return cardContent;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
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
  resetButton: {
    backgroundColor: COLORS.error,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 12,
  },
  resetButtonText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
});


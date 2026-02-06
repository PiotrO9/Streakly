import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { COLORS } from '@/constants/colors';

interface AddictionCardProps {
  name: string;
  streakLabel?: string;
  onPress?: () => void;
}

export function AddictionCard({ name, streakLabel, onPress }: AddictionCardProps) {
  const displayStreakLabel = streakLabel ?? '—';

  if (!onPress) {
    return (
      <Card style={styles.card}>
        <View style={styles.content}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.streak}>{displayStreakLabel}</Text>
        </View>
      </Card>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${name} addiction`}
    >
      <Card style={styles.card}>
        <View style={styles.content}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.streak}>{displayStreakLabel}</Text>
        </View>
      </Card>
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
  name: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  streak: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});


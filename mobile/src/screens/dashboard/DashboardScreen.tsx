import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { RootStackNavigationProp } from '@/app/navigation/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { COLORS } from '@/constants/colors';
import { ROUTES } from '@/constants/routes';
import type { Addiction } from '@/domain/models/Addiction';
import { useNavigation } from '@react-navigation/native';

/**
 * Mock data for skeleton - will be replaced with real data later
 */
const MOCK_ADDICTIONS: Addiction[] = [];

/**
 * Dashboard screen - displays list of tracked addictions
 * Skeleton implementation with placeholder data and empty state
 */
export function DashboardScreen() {
  const navigation = useNavigation<RootStackNavigationProp<'Dashboard'>>();

  function handleNavigateToAdd() {
    navigation.navigate(ROUTES.ADD_ADDICTION);
  }

  function handleAddictionPress(addiction: Addiction) {
    // TODO: Navigate to addiction detail screen
    console.log('Pressed addiction:', addiction.id);
  }

  function renderAddictionItem({ item }: { item: Addiction }) {
    return (
      <TouchableOpacity
        onPress={() => handleAddictionPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`View ${item.name} addiction`}
      >
        <Card style={styles.addictionCard}>
          <Text style={styles.addictionName}>{item.name}</Text>
          <Text style={styles.addictionStreak}>
            {item.longestStreakDays} days streak
          </Text>
        </Card>
      </TouchableOpacity>
    );
  }

  function renderEmptyState() {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>No addictions tracked</Text>
        <Text style={styles.emptyStateText}>
          Start tracking your recovery journey by adding your first addiction.
        </Text>
        <Button title="Add Addiction" onPress={handleNavigateToAdd} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Addictions</Text>
        <TouchableOpacity
          onPress={handleNavigateToAdd}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel="Add new addiction"
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {MOCK_ADDICTIONS.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={MOCK_ADDICTIONS}
          renderItem={renderAddictionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.surface,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  addictionCard: {
    marginBottom: 12,
  },
  addictionName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  addictionStreak: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
});

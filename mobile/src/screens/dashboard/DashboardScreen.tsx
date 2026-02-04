import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import type { RootStackNavigationProp } from '@/app/navigation/types';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/colors';

export function DashboardScreen() {
  const navigation = useNavigation<RootStackNavigationProp<'Dashboard'>>();

  function handleNavigateToAdd() {
    navigation.navigate(ROUTES.ADD_ADDICTION);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard Screen</Text>
      <Text style={styles.subtitle}>Główny ekran aplikacji</Text>
      <Button title="Dodaj uzależnienie" onPress={handleNavigateToAdd} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
});

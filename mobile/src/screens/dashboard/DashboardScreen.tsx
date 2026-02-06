import { StyleSheet, Text, View } from 'react-native';

import type { RootStackNavigationProp } from '@/app/navigation/types';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/colors';
import { ROUTES } from '@/constants/routes';
import { useNavigation } from '@react-navigation/native';

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
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
});

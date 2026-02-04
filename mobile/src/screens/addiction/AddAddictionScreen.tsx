import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import type { RootStackNavigationProp } from '@/app/navigation/types';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/colors';

export function AddAddictionScreen() {
  const navigation = useNavigation<RootStackNavigationProp<'AddAddiction'>>();

  function handleGoBack() {
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Addiction Screen</Text>
      <Text style={styles.subtitle}>Ekran dodawania uzależnienia</Text>
      <Button title="Powrót do Dashboard" onPress={handleGoBack} />
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

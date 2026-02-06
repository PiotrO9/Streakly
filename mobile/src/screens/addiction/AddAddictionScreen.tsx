import { StyleSheet, Text, View } from 'react-native';

import type { RootStackNavigationProp } from '@/app/navigation/types';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/colors';
import { useNavigation } from '@react-navigation/native';

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

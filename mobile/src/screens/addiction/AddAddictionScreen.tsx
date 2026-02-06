import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { RootStackNavigationProp } from '@/app/navigation/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { COLORS } from '@/constants/colors';
import { useNavigation } from '@react-navigation/native';

/**
 * Add Addiction screen - UI skeleton for adding a new addiction
 * Minimal implementation without validation or persistence logic
 */
export function AddAddictionScreen() {
  const navigation = useNavigation<RootStackNavigationProp<'AddAddiction'>>();
  const [addictionName, setAddictionName] = useState('');

  function handleGoBack() {
    navigation.goBack();
  }

  function handleSubmit() {
    // TODO: Add validation and persistence logic
    console.log('Submit addiction:', addictionName);
    // TODO: Navigate back after successful submission
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Add Addiction</Text>
        <Text style={styles.subtitle}>
          Enter the name of the addiction you want to track
        </Text>

        <View style={styles.form}>
          <Input
            label="Addiction name"
            placeholder="e.g., Smoking, Alcohol, Social Media"
            value={addictionName}
            onChangeText={setAddictionName}
            accessibilityLabel="Addiction name input"
            autoFocus
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Add"
              onPress={handleSubmit}
              disabled={!addictionName.trim()}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 32,
  },
  form: {
    gap: 20,
  },
  buttonContainer: {
    marginTop: 8,
  },
});

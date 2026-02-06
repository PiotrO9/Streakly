import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { initializeDatabase, getBootstrapResult } from '@/data/database/db';
import { COLORS } from '@/constants/colors';
import { RootNavigator } from './navigation/RootNavigator';

export default function App() {
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [databaseError, setDatabaseError] = useState<Error | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function handleInitializeDatabase() {
      console.log('[App] Starting database initialization...');
      setIsInitializing(true);

      try {
        console.log('[App] Calling initializeDatabase()...');
        await initializeDatabase();
        console.log('[App] Database initialized, checking bootstrap result...');

        const result = getBootstrapResult();
        console.log('[App] Bootstrap result:', result);

        if (result && !result.success) {
          throw result.error ?? new Error('Database bootstrap failed');
        }

        console.log('[App] Database ready! Current version:', result?.currentVersion);
        setIsDatabaseReady(true);
      } catch (error) {
        console.error('[App] Failed to initialize SQLite database', error);
        setDatabaseError(error instanceof Error ? error : new Error(String(error)));
        setIsDatabaseReady(false);
      } finally {
        setIsInitializing(false);
      }
    }

    void handleInitializeDatabase();
  }, []);

  // Show loading screen while initializing
  if (isInitializing || !isDatabaseReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Inicjalizacja bazy danych...</Text>
        {databaseError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Błąd inicjalizacji</Text>
            <Text style={styles.errorMessage}>{databaseError.message}</Text>
            <Text style={styles.errorHint}>
              Sprawdź konsolę dla szczegółów. Aplikacja może nie działać poprawnie.
            </Text>
          </View>
        )}
      </View>
    );
  }

  // If there was an error but we're still trying to render
  if (databaseError) {
    console.error('[App] Database initialization error (rendering anyway):', databaseError);
  }

  return <RootNavigator />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginTop: 24,
    padding: 16,
    width: '100%',
  },
  errorTitle: {
    color: COLORS.error,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorMessage: {
    color: COLORS.text,
    fontSize: 14,
    marginBottom: 8,
  },
  errorHint: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
});

import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useFonts } from 'expo-font';

import { COLORS } from '@/constants/colors';
import { FONTS, FONT_ASSETS } from '@/constants/fonts';
import { getBootstrapResult, initializeDatabase } from '@/data/database/db';

import { RootNavigator } from './navigation/RootNavigator';

const defaultTextStyle = { fontFamily: FONTS.regular };

function setDefaultFontFamily() {
  const originalRender = (Text as any).render;
  if (!originalRender) return;

  (Text as any).render = function (props: any, ref: any) {
    const { style, ...restProps } = props;
    const mergedStyle = [defaultTextStyle, style];
    return originalRender.call(this, { ...restProps, style: mergedStyle }, ref);
  };
}

export default function App() {
  const [fontsLoaded] = useFonts(FONT_ASSETS);
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [databaseError, setDatabaseError] = useState<Error | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (fontsLoaded) {
      setDefaultFontFamily();
    }
  }, [fontsLoaded]);

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

  if (!fontsLoaded || isInitializing || !isDatabaseReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Initializing database...</Text>
        {databaseError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Initialization Error</Text>
            <Text style={styles.errorMessage}>{databaseError.message}</Text>
            <Text style={styles.errorHint}>
              Check the console for details. The app may not work correctly.
            </Text>
          </View>
        )}
      </View>
    );
  }

  if (databaseError) {
    console.error('[App] Database initialization error (rendering anyway):', databaseError);
  }

  return <RootNavigator />;
}

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginTop: 24,
    padding: 16,
    width: '100%',
  },
  errorHint: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  errorMessage: {
    color: COLORS.text,
    fontSize: 14,
    marginBottom: 8,
  },
  errorTitle: {
    color: COLORS.error,
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    marginBottom: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    fontSize: 16,
    marginTop: 16,
  },
});

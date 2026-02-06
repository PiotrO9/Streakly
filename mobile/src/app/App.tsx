import { useEffect } from 'react';

import { initializeDatabase } from '@/data/database/db';
import { RootNavigator } from './navigation/RootNavigator';

export default function App() {
  useEffect(() => {
    async function handleInitializeDatabase() {
      try {
        await initializeDatabase();
      } catch (error) {
        console.error('Failed to initialize SQLite database', error);
      }
    }

    void handleInitializeDatabase();
  }, []);

  return <RootNavigator />;
}

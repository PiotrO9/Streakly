import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import type { RootStackParamList } from './types';
import { screens, initialRouteName } from './config';

const Stack = createStackNavigator<RootStackParamList>();

/**
 * Root navigator component
 * Configures the main navigation stack
 */
export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName}>
        {Object.entries(screens).map(([name, config]) => (
          <Stack.Screen
            key={name}
            name={name as keyof RootStackParamList}
            component={config.component}
            options={config.options}
          />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

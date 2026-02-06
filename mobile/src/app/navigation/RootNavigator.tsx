import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { initialRouteName, screens } from './config';
import type { RootStackParamList } from './types';

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

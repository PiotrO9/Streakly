import type { StackScreenProps } from '@react-navigation/stack';

/**
 * Root stack navigation param list
 * Defines all routes and their parameters
 */
export type RootStackParamList = {
  Dashboard: undefined;
  AddAddiction: undefined;
  AddictionDetail: { addictionId: string };
};

/**
 * Navigation prop types for screens
 * Usage: type Props = StackScreenProps<RootStackParamList, 'Dashboard'>
 */
export type RootStackScreenProps<T extends keyof RootStackParamList> = StackScreenProps<
  RootStackParamList,
  T
>;

/**
 * Navigation hook type
 * Usage: const navigation = useNavigation<RootStackNavigationProp<'Dashboard'>>()
 */
export type RootStackNavigationProp<T extends keyof RootStackParamList> =
  RootStackScreenProps<T>['navigation'];

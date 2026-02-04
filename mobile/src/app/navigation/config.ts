import React from 'react';
import type { StackNavigationOptions } from '@react-navigation/stack';
import type { RootStackParamList } from './types';

import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { AddAddictionScreen } from '@/screens/addiction/AddAddictionScreen';

/**
 * Screen configuration
 * Maps route names to screen components and options
 */
export interface ScreenConfig {
  component: React.ComponentType<any>;
  options?: StackNavigationOptions;
}

/**
 * Screen registry
 * Central place to register all screens
 */
export const screens: Record<keyof RootStackParamList, ScreenConfig> = {
  Dashboard: {
    component: DashboardScreen,
    options: {
      title: 'Dashboard',
    },
  },
  AddAddiction: {
    component: AddAddictionScreen,
    options: {
      title: 'Add Addiction',
    },
  },
};

/**
 * Initial route name
 */
export const initialRouteName: keyof RootStackParamList = 'Dashboard';

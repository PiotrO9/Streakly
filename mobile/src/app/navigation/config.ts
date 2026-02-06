import React from 'react';

import { AddAddictionScreen } from '@/screens/addiction/AddAddictionScreen';
import { AddictionDetailScreen } from '@/screens/addiction/AddictionDetailScreen';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import type { StackNavigationOptions } from '@react-navigation/stack';

import type { RootStackParamList } from './types';

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
  AddictionDetail: {
    component: AddictionDetailScreen,
    options: {
      title: 'Addiction Detail',
      headerShown: false,
    },
  },
};

/**
 * Initial route name
 */
export const initialRouteName: keyof RootStackParamList = 'Dashboard';

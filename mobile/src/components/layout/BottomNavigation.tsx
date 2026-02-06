import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import { COLORS } from '@/constants/colors';

export type BottomTab = 'Addiction' | 'Community';

interface BottomNavigationProps {
  activeTab: BottomTab;
  onTabChange: (tab: BottomTab) => void;
}

interface TabItemProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  icon: string;
  isDesktop: boolean;
}

function TabItem({ label, isActive, onPress, icon, isDesktop }: TabItemProps) {
  return (
    <TouchableOpacity
      style={[styles.tabItem, isDesktop && styles.tabItemDesktop]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} tab`}
      accessibilityState={{ selected: isActive }}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Icons matching the screenshot style
  const tabs: Array<{ key: BottomTab; label: string; icon: string }> = [
    { key: 'Addiction', label: 'Addictions', icon: '📊' }, // Bar chart icon
    { key: 'Community', label: 'Community', icon: '💬' }, // Speech bubbles icon
  ];

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      {tabs.map((tab) => (
        <TabItem
          key={tab.key}
          label={tab.label}
          isActive={activeTab === tab.key}
          onPress={() => onTabChange(tab.key)}
          icon={tab.icon}
          isDesktop={isDesktop}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 8,
    paddingBottom: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  containerDesktop: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 56,
  },
  tabItemDesktop: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  tabIconActive: {
    // Active icon color matches primary blue
  },
  tabLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

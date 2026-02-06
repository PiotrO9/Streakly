import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/constants/colors';

export type BottomTab = 'Addictions' | 'Pledges' | 'Community' | 'Motivation' | 'Support';

interface BottomNavigationProps {
  activeTab: BottomTab;
  onTabChange: (tab: BottomTab) => void;
}

interface TabItemProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  iconNameOutline: keyof typeof Ionicons.glyphMap;
  iconNameFilled: keyof typeof Ionicons.glyphMap;
  isDesktop: boolean;
}

function TabItem({ label, isActive, onPress, iconNameOutline, iconNameFilled, isDesktop }: TabItemProps) {
  return (
    <TouchableOpacity
      style={[styles.tabItem, isDesktop && styles.tabItemDesktop]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} tab`}
      accessibilityState={{ selected: isActive }}
      activeOpacity={0.7}
    >
      <Ionicons
        name={isActive ? iconNameFilled : iconNameOutline}
        size={20}
        color={isActive ? COLORS.primary : COLORS.textSecondary}
        style={styles.tabIcon}
      />
      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Icons matching the screenshot style - 5 tabs as shown in the design
  const tabs: Array<{
    key: BottomTab;
    label: string;
    iconNameOutline: keyof typeof Ionicons.glyphMap;
    iconNameFilled: keyof typeof Ionicons.glyphMap;
  }> = [
    { key: 'Addictions', label: 'Addictions', iconNameOutline: 'bar-chart-outline', iconNameFilled: 'bar-chart' }, // Stacked bar chart icon
    // { key: 'Pledges', label: 'Pledges', iconNameOutline: 'thumbs-up-outline', iconNameFilled: 'thumbs-up' }, // Hand with thumb up icon
    { key: 'Community', label: 'Community', iconNameOutline: 'people-outline', iconNameFilled: 'people' }, // Connected people icon
    // { key: 'Motivation', label: 'Motivation', iconNameOutline: 'flame-outline', iconNameFilled: 'flame' }, // Flame icon
    // { key: 'Support', label: 'Support', iconNameOutline: 'locate-outline', iconNameFilled: 'locate' }, // Target/Support icon
  ];

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      {tabs.map((tab) => (
        <TabItem
          key={tab.key}
          label={tab.label}
          isActive={activeTab === tab.key}
          onPress={() => onTabChange(tab.key)}
          iconNameOutline={tab.iconNameOutline}
          iconNameFilled={tab.iconNameFilled}
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
    paddingTop: 6,
    paddingBottom: 16,
    paddingHorizontal: 0,
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
    minHeight: 60,
  },
  containerDesktop: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 40,
    paddingTop: 12,
    paddingBottom: 24,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    minHeight: 50,
  },
  tabItemDesktop: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 2,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

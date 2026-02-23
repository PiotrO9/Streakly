import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import { COLORS } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import { Ionicons } from '@expo/vector-icons';

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

function TabItem({
  label,
  isActive,
  onPress,
  iconNameOutline,
  iconNameFilled,
  isDesktop,
}: TabItemProps) {
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
        size={32}
        color={isActive ? COLORS.primary : COLORS.textSecondary}
        style={styles.tabIcon}
      />
      {/* <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text> */}
    </TouchableOpacity>
  );
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Icons matching the screenshot style - 5 tabs as shown in the design
  const tabs: {
    key: BottomTab;
    label: string;
    iconNameOutline: keyof typeof Ionicons.glyphMap;
    iconNameFilled: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      key: 'Addictions',
      label: 'Addictions',
      iconNameOutline: 'bar-chart-outline',
      iconNameFilled: 'bar-chart',
    }, // Stacked bar chart icon
    // { key: 'Pledges', label: 'Pledges', iconNameOutline: 'thumbs-up-outline', iconNameFilled: 'thumbs-up' }, // Hand with thumb up icon
    {
      key: 'Community',
      label: 'Community',
      iconNameOutline: 'people-outline',
      iconNameFilled: 'people',
    }, // Connected people icon
    // { key: 'Motivation', label: 'Motivation', iconNameOutline: 'flame-outline', iconNameFilled: 'flame' }, // Flame icon
    // { key: 'Support', label: 'Support', iconNameOutline: 'locate-outline', iconNameFilled: 'locate' }, // Target/Support icon
  ];

  return (
    <View style={[styles.outerContainer, isDesktop && styles.outerContainerDesktop]}>
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        {tabs.map(tab => (
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderTopWidth: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    minHeight: 60,
    paddingBottom: 16,
    paddingHorizontal: 0,
    paddingTop: 6,
  },
  containerDesktop: {
    alignSelf: 'center',
    maxWidth: 800,
    paddingBottom: 24,
    paddingHorizontal: 40,
    paddingTop: 12,
    width: '100%',
  },
  outerContainer: {
    backgroundColor: COLORS.surface,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  outerContainerDesktop: {
    width: '100%',
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  tabItemDesktop: {
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  tabLabel: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
});

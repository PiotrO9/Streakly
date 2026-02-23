import { StyleSheet, Text, View } from 'react-native';

import { FONTS } from '@/constants/fonts';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E0E0E0',
    borderBottomWidth: 1,
    padding: 16,
  },
  title: {
    color: '#000000',
    fontFamily: FONTS.semiBold,
    fontSize: 20,
  },
});

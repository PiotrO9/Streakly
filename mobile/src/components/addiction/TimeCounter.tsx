import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { COLORS } from '@/constants/colors';
import type { ElapsedTimeBreakdown } from '@/utils/date';

interface TimeCounterProps {
  breakdown: ElapsedTimeBreakdown;
  addictionName?: string;
}

interface ProgressBarProps {
  label: string;
  value: number;
  current: number;
  max: number;
  color: string;
  index: number;
  isDesktop: boolean;
}

function ProgressBar({ label, value, current, max, color, index, isDesktop }: ProgressBarProps) {
  const progress = Math.min(current / max, 1); // Ensure progress is between 0 and 1
  
  // At 0% progress: bar starts at 0% and is 50% wide (covers 0%-50%)
  // At 100% progress: bar starts at 0% and is 100% wide (covers 0%-100%)
  // Bar always starts from left (0%) and grows to the right
  const barLeft = 0; // Always starts from the left
  const barWidth = 50 + (progress * 50); // Minimum 50%, grows to 100% at 100% progress

  // Darker background color for unfilled portion
  const getDarkerColor = (hexColor: string): string => {
    // Convert hex to RGB and darken by 50%
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const darkerR = Math.floor(r * 0.5);
    const darkerG = Math.floor(g * 0.5);
    const darkerB = Math.floor(b * 0.5);
    return `rgb(${darkerR}, ${darkerG}, ${darkerB})`;
  };

  const darkerColor = getDarkerColor(color);

  // On mobile, create layered 3D effect with slight offset
  const offsetX = index * 4; // Horizontal offset (right) for 3D effect
  
  const transformStyle = isDesktop
    ? {}
    : {
        transform: [{ translateX: offsetX }],
      };

  const displayText = `${value} ${label}`;

  return (
    <View
      style={[
        styles.progressBarContainer,
        isDesktop && styles.progressBarContainerDesktop,
        transformStyle,
        !isDesktop && styles.progressBarShadow,
      ]}
    >
      <View style={[styles.progressBarWrapper, isDesktop && styles.progressBarWrapperDesktop]}>
        {/* Background (unfilled portion) */}
        <View
          style={[
            styles.progressBarBackground,
            { backgroundColor: darkerColor },
            isDesktop && styles.progressBarBackgroundDesktop,
          ]}
        />
        {/* Filled portion - always minimum 50% width, grows to 100% from left to right */}
        <View
          style={[
            styles.progressBar,
            {
              backgroundColor: color,
              left: `${barLeft}%`,
              width: `${barWidth}%`,
              borderTopLeftRadius: isDesktop ? 20 : 18,
              borderBottomLeftRadius: isDesktop ? 20 : 18,
            },
            isDesktop && styles.progressBarDesktop,
          ]}
        >
          <View style={styles.progressBarContent}>
            <Text style={[styles.progressBarText, isDesktop && styles.progressBarTextDesktop]}>
              {displayText}
            </Text>
          </View>
          {/* Diagonal cut effect on the right side */}
          <View style={styles.diagonalCut}>
            <View style={[styles.diagonalCutInner, { backgroundColor: color }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

export function TimeCounter({ breakdown, addictionName }: TimeCounterProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Calculate progress for each time unit
  // Days: progress within a week (0-6 days = 0-100%)
  // Hours: progress within a day (0-23 hours = 0-100%)
  // Minutes: progress within an hour (0-59 minutes = 0-100%)
  // Seconds: progress within a minute (0-59 seconds = 0-100%)
  const timeUnits = [
    {
      label: breakdown.days === 1 ? 'day' : 'days',
      value: breakdown.days,
      current: breakdown.days % 7, // Progress within a week
      max: 7,
      color: '#14B8A6', // Teal-green
    },
    {
      label: breakdown.hours === 1 ? 'hour' : 'hours',
      value: breakdown.hours,
      current: breakdown.hours,
      max: 24,
      color: '#3B82F6', // Bright blue
    },
    {
      label: breakdown.minutes === 1 ? 'minute' : 'minutes',
      value: breakdown.minutes,
      current: breakdown.minutes,
      max: 60,
      color: '#60A5FA', // Lighter blue
    },
    {
      label: breakdown.seconds === 1 ? 'second' : 'seconds',
      value: breakdown.seconds,
      current: breakdown.seconds,
      max: 60,
      color: '#A78BFA', // Light purple
    },
  ];

  const titleText = addictionName
    ? `I've been ${addictionName.toLowerCase()} free for`
    : "I've been free for";

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <Text style={[styles.title, isDesktop && styles.titleDesktop]}>{titleText}</Text>
      <View style={[styles.timeUnitsContainer, isDesktop && styles.timeUnitsContainerDesktop]}>
        {timeUnits.map((unit, index) => (
          <ProgressBar
            key={unit.label}
            label={unit.label}
            value={unit.value}
            current={unit.current}
            max={unit.max}
            color={unit.color}
            index={index}
            isDesktop={isDesktop}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 24,
    width: '100%',
  },
  containerDesktop: {
    paddingHorizontal: 0,
    paddingVertical: 32,
    width: '100%',
  },
  title: {
    fontSize: 18,
    color: COLORS.surface,
    marginBottom: 24,
    textAlign: 'center',
  },
  titleDesktop: {
    fontSize: 22,
    marginBottom: 32,
  },
  timeUnitsContainer: {
    width: '100%',
    marginTop: 20,
  },
  timeUnitsContainerDesktop: {
    marginTop: 0,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  progressBarContainerDesktop: {
    width: '100%',
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  progressBarShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  progressBarWrapper: {
    width: '100%',
    height: 80,
    position: 'relative',
    overflow: 'hidden',
  },
  progressBarWrapperDesktop: {
    height: 90,
  },
  progressBarBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  progressBarBackgroundDesktop: {
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  progressBar: {
    height: '100%',
    paddingLeft: 24,
    paddingRight: 50,
    justifyContent: 'center',
    position: 'absolute',
    overflow: 'visible',
    minWidth: 120,
  },
  progressBarDesktop: {
    paddingLeft: 28,
    paddingRight: 54,
  },
  progressBarContent: {
    zIndex: 2,
  },
  progressBarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.surface,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  progressBarTextDesktop: {
    fontSize: 36,
  },
  diagonalCut: {
    position: 'absolute',
    right: -30,
    top: 0,
    bottom: 0,
    width: 60,
    overflow: 'visible',
    zIndex: 10,
  },
  diagonalCutInner: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    // @ts-expect-error - React Native accepts number for skewX, TypeScript types are incorrect
    transform: [{ skewX: -18 }],
  },
});

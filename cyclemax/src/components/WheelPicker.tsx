import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { colors, fonts } from '@/theme';

const ITEM_HEIGHT = 44;
const VISIBLE = 5;

/**
 * A scroll wheel ("Drehrad") for a short list of values. Snaps to items, works the same on iOS,
 * Android and web, and is adjustable with screen readers (swipe up/down).
 */
export function WheelPicker<T extends string | number>({
  values,
  value,
  onChange,
  format = String,
  accessibilityLabel,
  width,
}: {
  values: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format?: (value: T) => string;
  accessibilityLabel: string;
  width?: number;
}) {
  const ref = useRef<ScrollView>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const selectedIndex = Math.max(0, values.indexOf(value));
  const [highlight, setHighlight] = useState(selectedIndex);

  const scrollTo = useCallback((index: number, animated: boolean) => {
    ref.current?.scrollTo({ y: index * ITEM_HEIGHT, animated });
  }, []);

  useEffect(() => () => clearTimeout(settle.current), []);

  const commit = useCallback(
    (index: number) => {
      const clamped = Math.min(values.length - 1, Math.max(0, index));
      setHighlight(clamped);
      scrollTo(clamped, true);
      const next = values[clamped];
      if (next !== undefined && next !== value) onChange(next);
    },
    [onChange, scrollTo, value, values],
  );

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    setHighlight(Math.min(values.length - 1, Math.max(0, index)));
    clearTimeout(settle.current);
    settle.current = setTimeout(() => commit(index), 140);
  };

  return (
    <View
      style={[styles.wheel, width ? { width } : null]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: format(values[highlight] ?? value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => commit(highlight + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}
    >
      <View style={styles.band} pointerEvents="none" />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onLayout={() => scrollTo(selectedIndex, false)}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * Math.floor(VISIBLE / 2) }}
      >
        {values.map((v, i) => {
          const distance = Math.abs(i - highlight);
          return (
            <Pressable key={String(v)} onPress={() => commit(i)} style={styles.item} importantForAccessibility="no">
              <Text
                style={[
                  styles.itemText,
                  i === highlight ? styles.itemSelected : null,
                  { opacity: distance === 0 ? 1 : distance === 1 ? 0.5 : 0.22 },
                ]}
              >
                {format(v)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wheel: { height: ITEM_HEIGHT * VISIBLE, overflow: 'hidden', alignSelf: 'stretch' },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ITEM_HEIGHT * Math.floor(VISIBLE / 2),
    height: ITEM_HEIGHT,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  item: { height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontFamily: fonts.regular, fontSize: 20, color: colors.text },
  itemSelected: { fontFamily: fonts.semibold },
});

import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

/** Three quiet dots for the onboarding. */
export function Steps({ current, total = 3 }: { current: number; total?: number }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${current + 1} / ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.dot, i === current && styles.active]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignSelf: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.hairline },
  active: { width: 20, backgroundColor: colors.text },
});

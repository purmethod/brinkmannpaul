import { Tabs, type BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStrings } from '@/i18n';
import { colors, fonts } from '@/theme';

export default function TabLayout() {
  const s = useStrings();
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: s.tabs.home }} />
      <Tabs.Screen name="gestures" options={{ title: s.tabs.gestures }} />
      <Tabs.Screen name="settings" options={{ title: s.tabs.settings }} />
    </Tabs>
  );
}

/** Text-only tab bar: three words, the active one underlined in blood red. */
function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const title = descriptors[route.key]?.options.title ?? route.name;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={title}
            style={styles.tab}
          >
            <Text maxFontSizeMultiplier={1.3} style={[styles.label, focused && styles.active]}>
              {title}
            </Text>
            <View style={[styles.indicator, focused && styles.indicatorActive]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    paddingTop: 12,
  },
  tab: { flex: 1, alignItems: 'center', gap: 6, minHeight: 44, justifyContent: 'center' },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary },
  active: { fontFamily: fonts.semibold, color: colors.text },
  indicator: { width: 18, height: 2, borderRadius: 1, backgroundColor: 'transparent' },
  indicatorActive: { backgroundColor: colors.accent },
});

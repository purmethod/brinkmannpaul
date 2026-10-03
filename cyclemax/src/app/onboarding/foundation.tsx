import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Steps } from '@/components/Steps';
import { Button, Screen, Txt } from '@/components/ui';
import { PUR_URL, useStrings } from '@/i18n';
import { colors, space } from '@/theme';

export default function Foundation() {
  const s = useStrings();
  return (
    <Screen scroll={false} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Txt variant="title" accessibilityRole="header">
          {s.onboarding.foundationTitle}
        </Txt>
        <Txt variant="lead" muted>
          {s.onboarding.foundationBody}
        </Txt>
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(PUR_URL).catch(() => {})} hitSlop={12}>
          <Txt variant="lead" color={colors.accent} style={styles.link}>
            purmethod.com
          </Txt>
        </Pressable>
      </View>
      <View style={styles.footer}>
        <Steps current={1} />
        <Button label={s.next} onPress={() => router.push('/onboarding/cycle')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: 'center', gap: space.l },
  link: { textDecorationLine: 'underline' },
  footer: { gap: space.l },
});

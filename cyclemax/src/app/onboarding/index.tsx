import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Logo } from '@/components/Logo';
import { Steps } from '@/components/Steps';
import { Button, Screen, Txt } from '@/components/ui';
import { useStrings } from '@/i18n';
import { space } from '@/theme';

export default function Welcome() {
  const s = useStrings();
  return (
    <Screen scroll={false} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Logo size={148} />
        <Txt variant="display" accessibilityRole="header" style={styles.claim}>
          {s.claim}
        </Txt>
        <Txt variant="lead" muted style={styles.center}>
          {s.slogan}
        </Txt>
      </View>
      <View style={styles.footer}>
        <Steps current={0} />
        <Button label={s.next} onPress={() => router.push('/onboarding/foundation')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.l },
  claim: { textAlign: 'center', marginTop: space.m },
  center: { textAlign: 'center' },
  footer: { gap: space.l },
});

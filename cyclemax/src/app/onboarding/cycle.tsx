import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DateWheel } from '@/components/DateWheel';
import { Steps } from '@/components/Steps';
import { Button, Screen, Txt } from '@/components/ui';
import { WheelPicker } from '@/components/WheelPicker';
import { addDays, CYCLE_LENGTH, earliestSelectableStart, PERIOD_LENGTH } from '@/engine';
import { useStrings } from '@/i18n';
import { requestPermission } from '@/notifications/native';
import { completeOnboarding } from '@/state/actions';
import { useStore } from '@/state/store';
import { space } from '@/theme';

const range = (min: number, max: number) => Array.from({ length: max - min + 1 }, (_, i) => min + i);
const CYCLE_VALUES = range(CYCLE_LENGTH.min, CYCLE_LENGTH.max);
const PERIOD_VALUES = range(PERIOD_LENGTH.min, PERIOD_LENGTH.max);

export default function CycleSetup() {
  const s = useStrings();
  const { state, today, update } = useStore();
  const [lastPeriodStart, setLastPeriodStart] = useState(() => addDays(today, -14));
  const [cycleLength, setCycleLength] = useState<number>(CYCLE_LENGTH.default);
  const [periodLength, setPeriodLength] = useState<number>(PERIOD_LENGTH.default);
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    // The system dialog appears here; the app works the same if he declines.
    await requestPermission();
    update((current) => completeOnboarding(current, { lastPeriodStart, cycleLength, periodLength }, today));
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Txt variant="title" accessibilityRole="header" style={styles.title}>
        {s.onboarding.setupTitle}
      </Txt>

      <Txt variant="label" muted>
        {s.cycle.lastPeriod.toUpperCase()}
      </Txt>
      <DateWheel
        value={lastPeriodStart}
        onChange={setLastPeriodStart}
        min={earliestSelectableStart(today)}
        max={today}
        lang={state.language}
        label={s.cycle.lastPeriod}
      />

      <View style={styles.columns}>
        <View style={styles.column}>
          <Txt variant="label" muted>
            {s.cycle.cycleLength.toUpperCase()}
          </Txt>
          <WheelPicker
            values={CYCLE_VALUES}
            value={cycleLength}
            onChange={setCycleLength}
            format={s.cycle.days}
            accessibilityLabel={s.cycle.cycleLength}
          />
        </View>
        <View style={styles.column}>
          <Txt variant="label" muted>
            {s.cycle.periodLength.toUpperCase()}
          </Txt>
          <WheelPicker
            values={PERIOD_VALUES}
            value={periodLength}
            onChange={setPeriodLength}
            format={s.cycle.days}
            accessibilityLabel={s.cycle.periodLength}
          />
        </View>
      </View>

      <Txt variant="small" muted style={styles.privacy}>
        {s.onboarding.privacy}
      </Txt>
      <Steps current={2} />
      <Button label={s.onboarding.start} onPress={start} disabled={busy} style={styles.button} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: space.xl, marginBottom: space.xl },
  columns: { flexDirection: 'row', gap: space.m, marginTop: space.l },
  column: { flex: 1, gap: space.s },
  privacy: { marginTop: space.l, marginBottom: space.l, textAlign: 'center' },
  button: { marginTop: space.l },
});

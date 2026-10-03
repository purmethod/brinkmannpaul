import Constants from 'expo-constants';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Switch, View } from 'react-native';

import { DateWheel, TimeWheel } from '@/components/DateWheel';
import { Sheet } from '@/components/Sheet';
import { Button, Divider, Screen, SectionLabel, Txt } from '@/components/ui';
import { WheelPicker } from '@/components/WheelPicker';
import { GESTURE_NAMES, LANGS, type Lang } from '@/content';
import {
  CYCLE_LENGTH,
  earliestSelectableStart,
  GESTURE_INTERVAL_RANGE,
  GESTURE_ORDER,
  lastPeriodStart,
  PERIOD_LENGTH,
} from '@/engine';
import { PUR_URL, useStrings } from '@/i18n';
import { formatDate, formatTime } from '@/i18n/format';
import { getPermissionState, requestPermission, type PermissionState } from '@/notifications/native';
import { setGestureInterval, setPreferences, updateCycle } from '@/state/actions';
import { learnedSampleSize } from '@/state/selectors';
import { useStore } from '@/state/store';
import { colors, fonts, space } from '@/theme';

const range = (min: number, max: number) => Array.from({ length: max - min + 1 }, (_, i) => min + i);
type EditorKind = 'start' | 'cycle' | 'period' | 'time' | null;

export default function Settings() {
  const s = useStrings();
  const { state, today, update, resync, reset } = useStore();
  const [editor, setEditor] = useState<EditorKind>(null);
  const [permission, setPermission] = useState<PermissionState>('unsupported');
  const lang = state.language;
  const start = lastPeriodStart(state.periodStarts) ?? today;
  const learned = learnedSampleSize(state);

  useFocusEffect(
    useCallback(() => {
      void getPermissionState().then(setPermission);
    }, []),
  );

  const allow = async () => {
    if (permission === 'denied') {
      await Linking.openSettings().catch(() => {});
      return;
    }
    setPermission(await requestPermission());
    resync();
  };

  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(`${s.settings.deleteTitle}\n${s.settings.deleteBody}`)) void reset();
      return;
    }
    Alert.alert(s.settings.deleteTitle, s.settings.deleteBody, [
      { text: s.common.cancel, style: 'cancel' },
      { text: s.settings.delete, style: 'destructive', onPress: () => void reset() },
    ]);
  };

  return (
    <Screen>
      <Txt variant="title" accessibilityRole="header" style={styles.title}>
        {s.tabs.settings}
      </Txt>

      <SectionLabel>{s.settings.cycle}</SectionLabel>
      <Row label={s.cycle.lastPeriod} value={formatDate(start, lang)} onPress={() => setEditor('start')} />
      <Divider />
      <Row label={s.cycle.cycleLength} value={s.cycle.days(state.cycleLength)} onPress={() => setEditor('cycle')} />
      {learned > 0 && (
        <Txt variant="small" muted style={styles.hint}>
          {s.cycle.learned(learned)}
        </Txt>
      )}
      <Divider />
      <Row label={s.cycle.periodLength} value={s.cycle.days(state.periodLength)} onPress={() => setEditor('period')} />
      <Divider />
      <SwitchRow
        label={s.settings.contraception}
        value={state.hormonalContraception}
        onChange={(v) => update((c) => setPreferences(c, { hormonalContraception: v }))}
      />
      <Txt variant="small" muted style={styles.hint}>
        {s.settings.contraceptionHint}
      </Txt>

      <SectionLabel>{s.settings.notifications}</SectionLabel>
      {(permission === 'denied' || permission === 'undetermined') && (
        <View style={styles.permission}>
          <Txt variant="small" style={styles.flex}>
            {s.settings.permissionOff}
          </Txt>
          <Button kind="secondary" label={s.settings.permissionEnable} onPress={allow} style={styles.smallButton} />
        </View>
      )}
      <Row
        label={s.settings.time}
        value={formatTime(state.notifyHour, state.notifyMinute)}
        onPress={() => setEditor('time')}
      />
      <Divider />
      <SwitchRow
        label={s.settings.neutral}
        value={state.neutralNotifications}
        onChange={(v) => update((c) => setPreferences(c, { neutralNotifications: v }))}
      />
      <Txt variant="small" muted style={styles.hint}>
        {s.settings.neutralHint}
      </Txt>

      <SectionLabel>{s.settings.gestureIntervals}</SectionLabel>
      {GESTURE_ORDER.map((id, index) => (
        <View key={id}>
          {index > 0 && <Divider />}
          <Stepper
            label={GESTURE_NAMES[lang][id]}
            value={state.gestureIntervals[id]}
            format={s.settings.weeks}
            min={GESTURE_INTERVAL_RANGE.min}
            max={GESTURE_INTERVAL_RANGE.max}
            onChange={(weeks) => update((c) => setGestureInterval(c, id, weeks))}
          />
        </View>
      ))}

      <SectionLabel>{s.settings.language}</SectionLabel>
      <View style={styles.segment} accessibilityRole="radiogroup">
        {LANGS.map((l: Lang) => (
          <Pressable
            key={l}
            accessibilityRole="radio"
            accessibilityState={{ selected: l === lang }}
            onPress={() => update((c) => setPreferences(c, { language: l }))}
            style={[styles.segmentItem, l === lang && styles.segmentActive]}
          >
            <Txt variant="body" style={l === lang ? styles.semibold : undefined} muted={l !== lang}>
              {s.languages[l]}
            </Txt>
          </Pressable>
        ))}
      </View>

      <SectionLabel>{s.settings.foundation}</SectionLabel>
      <Row label="PUR Method" value="purmethod.com" onPress={() => Linking.openURL(PUR_URL).catch(() => {})} link />

      <Txt variant="small" muted style={styles.privacy}>
        {s.settings.privacy}
      </Txt>
      <Button kind="text" tone="danger" label={s.settings.deleteAll} onPress={confirmDelete} style={styles.delete} />
      <Txt variant="small" muted style={styles.version}>
        {`Cyclemax ${Constants.expoConfig?.version ?? ''} · Be the Cycleman.`}
      </Txt>

      <Sheet visible={editor !== null} onClose={() => setEditor(null)} closeLabel={s.common.close}>
        {editor === 'start' && (
          <Editor title={s.cycle.lastPeriod}>
            <DateWheel
              value={start}
              onChange={(d) => update((c) => updateCycle(c, { lastPeriodStart: d }, today))}
              min={earliestSelectableStart(today)}
              max={today}
              lang={lang}
              label={s.cycle.lastPeriod}
            />
          </Editor>
        )}
        {editor === 'cycle' && (
          <Editor title={s.cycle.cycleLength}>
            <WheelPicker
              values={range(CYCLE_LENGTH.min, CYCLE_LENGTH.max)}
              value={state.cycleLength}
              onChange={(n) => update((c) => updateCycle(c, { cycleLength: n }, today))}
              format={s.cycle.days}
              accessibilityLabel={s.cycle.cycleLength}
            />
          </Editor>
        )}
        {editor === 'period' && (
          <Editor title={s.cycle.periodLength}>
            <WheelPicker
              values={range(PERIOD_LENGTH.min, PERIOD_LENGTH.max)}
              value={state.periodLength}
              onChange={(n) => update((c) => updateCycle(c, { periodLength: n }, today))}
              format={s.cycle.days}
              accessibilityLabel={s.cycle.periodLength}
            />
          </Editor>
        )}
        {editor === 'time' && (
          <Editor title={s.settings.time}>
            <TimeWheel
              hour={state.notifyHour}
              minute={state.notifyMinute}
              onChange={(h, m) => update((c) => setPreferences(c, { notifyHour: h, notifyMinute: m }))}
              lang={lang}
              label={s.settings.time}
            />
          </Editor>
        )}
        <Button label={s.common.done} onPress={() => setEditor(null)} />
      </Sheet>
    </Screen>
  );
}

function Editor({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.editor}>
      <Txt variant="title" accessibilityRole="header">
        {title}
      </Txt>
      {children}
    </View>
  );
}

function Row({ label, value, onPress, link }: { label: string; value: string; onPress: () => void; link?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={link ? 'link' : 'button'}
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Txt variant="body" style={styles.flex}>
        {label}
      </Txt>
      <Txt variant="body" color={link ? colors.accent : colors.textSecondary}>
        {value}
      </Txt>
    </Pressable>
  );
}

function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Txt variant="body" style={styles.flex}>
        {label}
      </Txt>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ true: colors.accent, false: colors.hairline }}
        thumbColor={colors.background}
        ios_backgroundColor={colors.hairline}
      />
    </View>
  );
}

function Stepper({
  label,
  value,
  format,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: format(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) =>
        onChange(Math.min(max, Math.max(min, value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))
      }
    >
      <Txt variant="body" style={styles.flex}>
        {label}
      </Txt>
      <StepButton symbol="−" disabled={value <= min} onPress={() => onChange(value - 1)} />
      <Txt variant="body" style={styles.stepValue}>
        {format(value)}
      </Txt>
      <StepButton symbol="+" disabled={value >= max} onPress={() => onChange(value + 1)} />
    </View>
  );
}

function StepButton({ symbol, disabled, onPress }: { symbol: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      importantForAccessibility="no"
      style={({ pressed }) => [styles.step, (pressed || disabled) && { opacity: disabled ? 0.3 : 0.6 }]}
    >
      <Txt variant="lead">{symbol}</Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: space.l },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56, gap: space.m },
  pressed: { opacity: 0.6 },
  flex: { flex: 1 },
  hint: { marginTop: -space.xs, marginBottom: space.m },
  permission: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: space.m,
    marginBottom: space.s,
  },
  smallButton: { minHeight: 40, backgroundColor: colors.background },
  segment: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 14, padding: 4 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10 },
  segmentActive: { backgroundColor: colors.background },
  semibold: { fontFamily: fonts.semibold },
  step: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { minWidth: 88, textAlign: 'center' },
  privacy: { marginTop: space.xl },
  delete: { alignSelf: 'flex-start', paddingHorizontal: 0, marginTop: space.s },
  version: { marginTop: space.l },
  editor: { gap: space.m },
});

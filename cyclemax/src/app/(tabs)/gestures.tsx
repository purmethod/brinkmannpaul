import { StyleSheet, View } from 'react-native';

import { Button, Divider, Screen, Txt } from '@/components/ui';
import { GESTURE_NAMES } from '@/content';
import { gestureDueDate, GESTURE_ORDER, weeksSince, type GestureId, type ISODate } from '@/engine';
import { useStrings, type Strings } from '@/i18n';
import { markGestureDone, undoGesture } from '@/state/actions';
import type { AppState } from '@/state/schema';
import { useStore } from '@/state/store';
import { colors, space } from '@/theme';

export default function Gestures() {
  const s = useStrings();
  const { state, today, update } = useStore();

  return (
    <Screen>
      <Txt variant="title" accessibilityRole="header" style={styles.title}>
        {s.tabs.gestures}
      </Txt>
      <Txt variant="body" muted style={styles.intro}>
        {s.gestures.intro}
      </Txt>
      {GESTURE_ORDER.map((id, index) => (
        <View key={id}>
          {index > 0 && <Divider />}
          <GestureRow
            id={id}
            state={state}
            today={today}
            s={s}
            onToggle={(done) =>
              update((current) => (done ? undoGesture(current, id) : markGestureDone(current, id, today)))
            }
          />
        </View>
      ))}
    </Screen>
  );
}

function GestureRow({
  id,
  state,
  today,
  s,
  onToggle,
}: {
  id: GestureId;
  state: AppState;
  today: ISODate;
  s: Strings;
  onToggle: (doneToday: boolean) => void;
}) {
  const log = state.gestures[id];
  const doneToday = log.last === today;
  const weeks = weeksSince(log.last, today);
  const due = gestureDueDate(log, state.gestureIntervals[id], state.installedAt) <= today;
  const name = GESTURE_NAMES[state.language][id];
  const detail = doneToday ? s.gestures.today : weeks === null ? s.gestures.never : s.gestures.ago(weeks);
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Txt variant="lead">{name}</Txt>
        <Txt variant="small" muted>
          {detail}
          {due && !doneToday ? <Txt variant="small" color={colors.accent}>{` · ${s.gestures.due}`}</Txt> : null}
        </Txt>
      </View>
      <Button
        kind={doneToday ? 'text' : 'secondary'}
        label={doneToday ? s.gestures.undo : s.gestures.done}
        onPress={() => onToggle(doneToday)}
        accessibilityHint={name}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: space.l },
  intro: { marginTop: space.s, marginBottom: space.l },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.m, paddingVertical: space.m },
  text: { flex: 1, gap: 2 },
  button: { minHeight: 44, paddingHorizontal: space.m, borderRadius: 12 },
});

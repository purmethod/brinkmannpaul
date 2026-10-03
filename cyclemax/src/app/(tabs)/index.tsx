import { useState } from 'react';
import { StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';

import { DateWheel } from '@/components/DateWheel';
import { PhaseRing } from '@/components/PhaseRing';
import { Sheet } from '@/components/Sheet';
import { Button, Divider, Screen, Txt } from '@/components/ui';
import { askCoach, buildCoachRequest, MAX_SITUATION_LENGTH, type CoachResult } from '@/coach/client';
import { COACH_URL } from '@/coach/config';
import { getPhaseContent, impulseFor, PHASES, QUOTE_SOURCE, quoteFor, type Lang } from '@/content';
import {
  daysSince,
  earliestSelectableStart,
  lastAnyGesture,
  PHASE_ORDER,
  toDayNumber,
  type CycleStatus,
  type ISODate,
} from '@/engine';
import { useStrings, type Strings } from '@/i18n';
import { logPeriod } from '@/state/actions';
import { statusOn } from '@/state/selectors';
import { useStore } from '@/state/store';
import { colors, phaseColors, space } from '@/theme';

export default function Home() {
  const s = useStrings();
  const { state, today, update } = useStore();
  const { width } = useWindowDimensions();
  const [periodOpen, setPeriodOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const status = statusOn(state, today);
  if (!status) return null;

  const lang = state.language;
  const ringSize = Math.min(width - space.l * 2, 300);
  const naturalOrPeriod = status.mode === 'natural' || status.isPeriodDay;
  const name = naturalOrPeriod ? PHASES[lang][status.phase].name : s.home.noPeriodDay;
  const dayLine = s.home.dayOf(status.cycleDay, status.cycleLength);

  return (
    <Screen>
      <View style={styles.ringWrap}>
        <PhaseRing
          status={status}
          size={ringSize}
          accessibilityLabel={s.home.ringLabel(name, status.cycleDay, status.cycleLength)}
        >
          <Txt variant="title" style={styles.center} numberOfLines={1} adjustsFontSizeToFit>
            {name}
          </Txt>
          <Txt variant="small" muted style={styles.center}>
            {dayLine}
          </Txt>
        </PhaseRing>
      </View>

      {status.isLate && (
        <View style={styles.late}>
          <Txt variant="label" color={colors.accent}>
            {s.home.late(status.daysLate).toUpperCase()}
          </Txt>
          <Txt variant="small" muted style={styles.center}>
            {s.home.lateHint}
          </Txt>
        </View>
      )}

      {naturalOrPeriod ? <PhaseBody status={status} lang={lang} /> : <PeriodOnlyBody s={s} lang={lang} today={today} />}

      <View style={styles.buttons}>
        <Button label={s.home.howToReact} onPress={() => setCoachOpen(true)} />
        <Button kind="secondary" label={s.home.periodStarted} onPress={() => setPeriodOpen(true)} />
      </View>

      <PeriodSheet
        visible={periodOpen}
        onClose={() => setPeriodOpen(false)}
        onSave={(date) => {
          update((current) => logPeriod(current, date, today));
          setPeriodOpen(false);
        }}
        today={today}
        lang={lang}
        s={s}
      />
      <CoachSheet
        visible={coachOpen}
        onClose={() => setCoachOpen(false)}
        status={status}
        daysSinceLastGesture={daysSince(lastAnyGesture(state.gestures), today)}
        lang={lang}
        s={s}
      />
    </Screen>
  );
}

function PhaseBody({ status, lang }: { status: CycleStatus; lang: Lang }) {
  const content = getPhaseContent(lang, status.phase);
  const quote = quoteFor(lang, status.phase, status.dayInPhase);
  const impulse = impulseFor(lang, status.phase, status.dayInPhase, status.cycleIndex, status.phaseLength);
  const color = phaseColors[status.phase];
  return (
    <View>
      <Txt variant="lead" style={styles.stance}>
        {content.stance}
      </Txt>
      <View style={styles.actions}>
        {content.actions.map((action) => (
          <View key={action} style={styles.action}>
            <View style={[styles.bullet, { backgroundColor: color }]} />
            <Txt style={styles.actionText}>{action}</Txt>
          </View>
        ))}
      </View>
      <Divider />
      <Txt variant="body" muted style={styles.impulse}>
        {impulse}
      </Txt>
      <QuoteCard text={quote.text} source={`${QUOTE_SOURCE[lang]} ${quote.ref}`} lang={lang} />
    </View>
  );
}

/** Hormonal contraception, no period day: only the note, an impulse and a quote. */
function PeriodOnlyBody({ s, lang, today }: { s: Strings; lang: Lang; today: ISODate }) {
  const day = toDayNumber(today);
  const impulses = PHASE_ORDER.flatMap((p) => PHASES[lang][p].impulses);
  const quotes = PHASE_ORDER.flatMap((p) => PHASES[lang][p].quotes);
  const quote = quotes[day % quotes.length]!;
  return (
    <View>
      <Txt variant="small" muted style={styles.stance}>
        {s.home.contraceptionNote}
      </Txt>
      <Divider />
      <Txt variant="lead" style={styles.impulse}>
        {impulses[day % impulses.length]}
      </Txt>
      <QuoteCard text={quote.text} source={`${QUOTE_SOURCE[lang]} ${quote.ref}`} lang={lang} />
    </View>
  );
}

function QuoteCard({ text, source, lang }: { text: string; source: string; lang: Lang }) {
  return (
    <View style={styles.quote}>
      <Txt variant="body">{lang === 'de' ? `„${text}“` : `“${text}”`}</Txt>
      <Txt variant="small" muted>
        {source}
      </Txt>
    </View>
  );
}

function PeriodSheet({
  visible,
  onClose,
  onSave,
  today,
  lang,
  s,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (date: ISODate) => void;
  today: ISODate;
  lang: Lang;
  s: Strings;
}) {
  const [other, setOther] = useState(false);
  const [date, setDate] = useState(today);
  const close = () => {
    setOther(false);
    setDate(today);
    onClose();
  };
  return (
    <Sheet visible={visible} onClose={close} closeLabel={s.common.close}>
      <Txt variant="title" accessibilityRole="header">
        {s.home.periodStarted}
      </Txt>
      {!other ? (
        <>
          <Button label={s.period.today} onPress={() => onSave(today)} />
          <Button kind="text" label={s.period.otherDate} onPress={() => setOther(true)} />
        </>
      ) : (
        <>
          <DateWheel
            value={date}
            onChange={setDate}
            min={earliestSelectableStart(today)}
            max={today}
            lang={lang}
            label={s.period.otherDate}
          />
          <Button
            label={s.period.save}
            onPress={() => {
              onSave(date);
              setOther(false);
            }}
          />
        </>
      )}
    </Sheet>
  );
}

function CoachSheet({
  visible,
  onClose,
  status,
  daysSinceLastGesture,
  lang,
  s,
}: {
  visible: boolean;
  onClose: () => void;
  status: CycleStatus;
  daysSinceLastGesture: number | null;
  lang: Lang;
  s: Strings;
}) {
  const [situation, setSituation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CoachResult | null>(null);

  const ask = async () => {
    setLoading(true);
    const answer = await askCoach(buildCoachRequest(status, daysSinceLastGesture, situation, lang), {
      baseUrl: COACH_URL,
    });
    setResult(answer);
    setLoading(false);
  };
  const close = () => {
    setSituation('');
    setResult(null);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={close} closeLabel={s.common.close}>
      <Txt variant="title" accessibilityRole="header">
        {s.home.howToReact}
      </Txt>
      {result ? (
        <View style={styles.answer} accessibilityLiveRegion="polite">
          {result.source === 'fallback' && (
            <Txt variant="small" muted>
              {s.coach.fallback}
            </Txt>
          )}
          <Txt variant="lead">{result.text}</Txt>
        </View>
      ) : (
        <>
          <TextInput
            value={situation}
            onChangeText={setSituation}
            placeholder={s.coach.placeholder}
            placeholderTextColor={colors.textSecondary}
            maxLength={MAX_SITUATION_LENGTH}
            multiline
            style={styles.input}
            accessibilityLabel={s.home.howToReact}
          />
          <Txt variant="small" muted>
            {s.coach.privacy}
          </Txt>
        </>
      )}
      {result ? (
        <Button kind="secondary" label={s.common.close} onPress={close} />
      ) : (
        <Button label={loading ? s.coach.loading : s.coach.ask} onPress={ask} disabled={loading} />
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  ringWrap: { alignItems: 'center', marginTop: space.l, marginBottom: space.l },
  center: { textAlign: 'center' },
  late: { alignItems: 'center', gap: space.xs, marginBottom: space.l },
  stance: { marginBottom: space.l },
  actions: { gap: space.m, marginBottom: space.l },
  action: { flexDirection: 'row', gap: space.m, alignItems: 'flex-start' },
  bullet: { width: 4, alignSelf: 'stretch', borderRadius: 2, minHeight: 20 },
  actionText: { flex: 1 },
  impulse: { marginTop: space.l, marginBottom: space.l },
  quote: { backgroundColor: colors.surface, borderRadius: 16, padding: space.l, gap: space.s },
  buttons: { gap: space.m, marginTop: space.xl },
  input: {
    minHeight: 96,
    maxHeight: 160,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: space.m,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    textAlignVertical: 'top',
    fontFamily: 'Inter_400Regular',
  },
  answer: { gap: space.s, paddingVertical: space.s },
});

import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import type { Lang } from '@/content';
import { addDays, atLocalTime, diffDays, toISODate, type ISODate } from '@/engine';
import { formatDate, formatTime, localeOf } from '@/i18n/format';
import { colors } from '@/theme';

import { Button } from './ui';
import { WheelPicker } from './WheelPicker';

/**
 * Date "Drehrad": the native spinner (@react-native-community/datetimepicker, display="spinner")
 * on iOS and Android; a wheel of dates on web, where the native picker does not exist.
 */
export function DateWheel({
  value,
  onChange,
  min,
  max,
  lang,
  label,
}: {
  value: ISODate;
  onChange: (date: ISODate) => void;
  min: ISODate;
  max: ISODate;
  lang: Lang;
  label: string;
}) {
  const [androidOpen, setAndroidOpen] = useState(false);
  const dates = useMemo(() => Array.from({ length: diffDays(max, min) + 1 }, (_, i) => addDays(min, i)), [min, max]);

  if (Platform.OS === 'web') {
    return (
      <WheelPicker
        values={dates}
        value={value}
        onChange={onChange}
        format={(d) => formatDate(d, lang)}
        accessibilityLabel={label}
      />
    );
  }

  const handle = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setAndroidOpen(false);
    if (event.type === 'set' && date) {
      const iso = toISODate(date);
      onChange(iso < min ? min : iso > max ? max : iso);
    }
  };

  const picker = (
    <DateTimePicker
      value={atLocalTime(value, 12, 0)}
      mode="date"
      display="spinner"
      onChange={handle}
      minimumDate={atLocalTime(min, 0, 0)}
      maximumDate={atLocalTime(max, 23, 59)}
      locale={localeOf(lang)}
      textColor={colors.text}
      themeVariant="light"
      accessibilityLabel={label}
    />
  );

  if (Platform.OS === 'android') {
    return (
      <View style={styles.androidRow}>
        <Button
          kind="secondary"
          label={formatDate(value, lang)}
          onPress={() => setAndroidOpen(true)}
          accessibilityHint={label}
        />
        {androidOpen && picker}
      </View>
    );
  }
  return picker;
}

/** Time "Drehrad" for the push time. */
export function TimeWheel({
  hour,
  minute,
  onChange,
  lang,
  label,
}: {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
  lang: Lang;
  label: string;
}) {
  const [androidOpen, setAndroidOpen] = useState(false);

  if (Platform.OS === 'web') {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
    return (
      <View style={styles.timeRow}>
        <WheelPicker
          values={hours}
          value={hour}
          onChange={(h) => onChange(h, minute)}
          format={(h) => String(h).padStart(2, '0')}
          accessibilityLabel={label}
          width={96}
        />
        <WheelPicker
          values={minutes}
          value={minutes.includes(minute) ? minute : 0}
          onChange={(m) => onChange(hour, m)}
          format={(m) => String(m).padStart(2, '0')}
          accessibilityLabel={label}
          width={96}
        />
      </View>
    );
  }

  const value = new Date();
  value.setHours(hour, minute, 0, 0);
  const handle = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setAndroidOpen(false);
    if (event.type === 'set' && date) onChange(date.getHours(), date.getMinutes());
  };
  const picker = (
    <DateTimePicker
      value={value}
      mode="time"
      display="spinner"
      is24Hour
      onChange={handle}
      locale={localeOf(lang)}
      textColor={colors.text}
      themeVariant="light"
      accessibilityLabel={label}
    />
  );
  if (Platform.OS === 'android') {
    return (
      <View style={styles.androidRow}>
        <Button
          kind="secondary"
          label={formatTime(hour, minute)}
          onPress={() => setAndroidOpen(true)}
          accessibilityHint={label}
        />
        {androidOpen && picker}
      </View>
    );
  }
  return picker;
}

const styles = StyleSheet.create({
  androidRow: { alignSelf: 'stretch' },
  timeRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
});

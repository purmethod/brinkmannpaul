/**
 * Renders the real app (all routes in src/app) in the iOS test environment and walks through it like a user:
 * onboarding → home → coach → gestures → settings → delete everything.
 */
import { Alert } from 'react-native';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import * as Notifications from 'expo-notifications';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'de' }] }));
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date' },
  AndroidImportance: { DEFAULT: 3 },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
  getPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  scheduleNotificationAsync: jest.fn(async () => 'id'),
}));

const schedule = Notifications.scheduleNotificationAsync as jest.Mock;
const tap = (text: string) => fireEvent.press(screen.getByText(text));

describe('Cyclemax app', () => {
  it('runs through onboarding, home, coach, gestures and settings', async () => {
    renderRouter('./src/app');

    // Onboarding 1–3
    expect(await screen.findByText('Sei der Fels in der Brandung.')).toBeTruthy();
    tap('Weiter');
    expect(await screen.findByText('Das Fundament: PUR Method')).toBeTruthy();
    tap('Weiter');
    expect(await screen.findByText('Frag sie nach ihrem Zyklus.')).toBeTruthy();
    tap('Los');

    // Home: default start is 14 days ago → day 15 of 28 = Hochphase.
    expect(await screen.findByText('Wie reagiere ich?')).toBeTruthy();
    expect(screen.getByText('Hochphase')).toBeTruthy();
    expect(screen.getByText('Tag 15 von 28')).toBeTruthy();
    expect(
      screen.getByText('Sie fühlt sich gut – zeig Aufmerksamkeit, sieh sie, ergreif die Initiative.'),
    ).toBeTruthy();
    expect(screen.getByText(/frei nach Marc Aurel, Selbstbetrachtungen 2,5/)).toBeTruthy();

    // Notifications: Brandung and the next period are still ahead in this cycle, plus one gesture reminder.
    await waitFor(() => expect(schedule).toHaveBeenCalled());
    const ids = schedule.mock.calls.map(([request]) => request.identifier as string);
    expect(ids.filter((id) => id.startsWith('phase:'))).toHaveLength(2);
    expect(ids.some((id) => id.endsWith(':brandung'))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);

    // Coach without a configured proxy → offline impulse.
    tap('Wie reagiere ich?');
    fireEvent.changeText(screen.getByPlaceholderText(/Optional/), 'Sie ist gereizt wegen der Arbeit');
    tap('Rat holen');
    expect(await screen.findByText('Offline. Ein Impuls für diese Phase:')).toBeTruthy();
    tap('Schließen');

    // "Started today", 14 days after the entered start: same period, corrected → day 1, Ruhe, cycle stays 28.
    tap('Periode hat begonnen');
    tap('Periode hat heute begonnen');
    expect(await screen.findByText('Tag 1 von 28')).toBeTruthy();
    expect(screen.getByText('Ruhe')).toBeTruthy();

    // Gestures
    fireEvent.press(screen.getByRole('tab', { name: 'Gesten' }));
    expect(await screen.findByText('Zeit nur für sie')).toBeTruthy();
    fireEvent.press(screen.getAllByText('Erledigt')[0]!);
    expect(await screen.findByText('Heute erledigt')).toBeTruthy();
    tap('Rückgängig');
    expect(await screen.findAllByText('Erledigt')).toHaveLength(5);

    // Settings: contraception → home shows period days only.
    fireEvent.press(screen.getByRole('tab', { name: 'Einstellungen' }));
    expect(await screen.findByText('Alle Daten löschen')).toBeTruthy();
    fireEvent(screen.getByLabelText('Sie nimmt hormonelle Verhütung'), 'valueChange', true);
    fireEvent.press(screen.getByRole('tab', { name: 'Heute' }));
    expect(await screen.findByText(/Hormonelle Verhütung: Die Phasen verlaufen nicht natürlich/)).toBeTruthy();

    // Language switch
    fireEvent.press(screen.getByRole('tab', { name: 'Einstellungen' }));
    tap('English');
    expect(await screen.findByText('Delete all data')).toBeTruthy();
    tap('Deutsch');

    // Delete everything → back to onboarding.
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => buttons?.[1]?.onPress?.());
    tap('Alle Daten löschen');
    expect(await screen.findByText('Sei der Fels in der Brandung.')).toBeTruthy();
  });
});

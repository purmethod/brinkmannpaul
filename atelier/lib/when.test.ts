import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseWhen } from './when.ts';

// thursday 2026-10-08, 14:20 local; next free slot friday 09:00
const NOW = '2026-10-08T14:20';
const SLOT = '2026-10-09T09:00';
const at = (t: string) => parseWhen(t, NOW, SLOT).at;

test('day + clock', () => {
  assert.equal(at('Brot frisch aus dem Ofen, poste das morgen um 18 Uhr'), '2026-10-09T18:00');
  assert.equal(at('morgen um 18:30'), '2026-10-09T18:30');
  assert.equal(at('übermorgen um 7.15 uhr'), '2026-10-10T07:15');
  assert.equal(at('freitag abend'), '2026-10-09T19:00');
  assert.equal(at('am montag um 9'), '2026-10-12T09:00');
  assert.equal(at('nächsten donnerstag um 12 uhr'), '2026-10-15T12:00');
  assert.equal(at('tomorrow at 6pm'), '2026-10-09T18:00');
  assert.equal(at('post it on saturday at 10:30 am'), '2026-10-10T10:30');
  assert.equal(at('am 24.12. um 17 uhr'), '2026-12-24T17:00');
  assert.equal(at('12. oktober abends'), '2026-10-12T19:00');
  assert.equal(at('morgen früh'), '2026-10-09T08:00');
  assert.equal(at('heute abend'), '2026-10-08T19:00');
  assert.equal(at('tonight'), '2026-10-08T19:00');
  assert.equal(at('um 18 uhr 30'), '2026-10-08T18:30');
});

test('clock only: today if still ahead, else tomorrow', () => {
  assert.equal(at('um 18 uhr'), '2026-10-08T18:00');
  assert.equal(at('um 9 uhr'), '2026-10-09T09:00');
  assert.equal(at('halb sieben'), '2026-10-08T18:30');
  assert.equal(at('um sechs'), '2026-10-08T18:00');
  assert.equal(at('at 8 pm'), '2026-10-08T20:00');
});

test('day only takes the slot time', () => {
  assert.equal(at('sonntag'), '2026-10-11T09:00');
  assert.equal(at('morgen'), '2026-10-09T09:00');
});

test('now and relative', () => {
  const n = parseWhen('poste es jetzt', NOW, SLOT);
  assert.equal(n.now, true);
  assert.equal(n.at, NOW);
  assert.equal(parseWhen('sofort', NOW).now, true);
  assert.equal(parseWhen('post it now', NOW).now, true);
  assert.equal(at('in 2 stunden'), '2026-10-08T16:20');
  assert.equal(at('in einer halben stunde'), '2026-10-08T14:50');
  assert.equal(at('in 20 min'), '2026-10-08T14:40');
  assert.equal(at('in an hour'), '2026-10-08T15:20');
});

test('content is not time', () => {
  assert.equal(at('heute gab es frisches brot mit butter'), null);
  assert.equal(at('my morning routine with eggs'), null);
  assert.equal(at('guten morgen, ein ei und avocado'), null);
  assert.equal(at('um 5 kilo abzunehmen braucht es protein'), null);
  assert.equal(at('2.50 euro für ein brot'), null);
  assert.equal(at('abendessen mit freunden'), null);
  assert.equal(at('frühstück im café'), null);
  assert.equal(at('jetzt wird gekocht'), null);
});

test('rest keeps the content, drops the time words', () => {
  assert.equal(parseWhen('Brot frisch aus dem Ofen, poste das morgen um 18 Uhr', NOW).rest, 'Brot frisch aus dem Ofen');
  assert.equal(parseWhen('morgen um 9 posten: mein Frühstück mit Eiern', NOW).rest, 'mein Frühstück mit Eiern');
  assert.equal(parseWhen('heute gab es Brot', NOW).rest, 'heute gab es Brot');
  assert.equal(parseWhen('salmon bowl, post it tomorrow at 6pm', NOW).rest, 'salmon bowl');
});

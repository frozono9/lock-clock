import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shiftedDate, clockText, dateText } from './clock.js';
test('backward offsets cross midnight and update the date', () => {
  const earlier = shiftedDate(new Date(2026,9,21,0,2).getTime(),9);
  assert.equal(clockText(earlier),'23:53'); assert.equal(earlier.getDate(),20);
  assert.match(dateText(earlier),/Tuesday/);
});
test('clock continues to follow elapsed real time and supports 12 hours', () => {
  const now = new Date(2026,9,21,16,52).getTime();
  assert.equal(clockText(shiftedDate(now,5)),'16:47');
  assert.equal(clockText(shiftedDate(now+60_000,5)),'16:48');
  assert.equal(clockText(shiftedDate(now,5),true),'4:47');
});
test('every performance digit travels backward, never forward', () => {
  const now = Date.now();
  for (let digit=1; digit<=9; digit++) assert.equal(shiftedDate(now,digit).getTime(),now-digit*60_000);
});
test('rejects multiple digits and fractions', () => { for (const n of [10,-1,1.5,NaN,'3']) assert.throws(() => shiftedDate(Date.now(),n),RangeError); });

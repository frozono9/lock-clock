import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shiftedDate, clockText, dateText } from './clock.js';
test('18:38 with digit 3 initially displays 18:41', () => {
  const now = new Date(2026,9,21,18,38).getTime();
  assert.equal(clockText(shiftedDate(now,3)), '18:41');
  assert.equal(clockText(shiftedDate(now,0)), '18:38');
});
test('ahead time can cross midnight and returning to real time restores the date', () => {
  const now = new Date(2026,9,21,23,57).getTime();
  const ahead = shiftedDate(now,9);
  assert.equal(clockText(ahead),'00:06'); assert.equal(ahead.getDate(),22);
  assert.match(dateText(ahead),/Thursday/);
  assert.equal(shiftedDate(now,0).getDate(),21);
});
test('clock continues to follow elapsed real time and supports 12 hours', () => {
  const now = new Date(2026,9,21,16,52).getTime();
  assert.equal(clockText(shiftedDate(now,5)),'16:57');
  assert.equal(clockText(shiftedDate(now+60_000,5)),'16:58');
  assert.equal(clockText(shiftedDate(now,5),true),'4:57');
  assert.equal(clockText(shiftedDate(now+60_000,0)),'16:53');
});
test('every digit presets the clock ahead by exactly that many minutes', () => {
  const now = Date.now();
  for (let digit=1; digit<=9; digit++) assert.equal(shiftedDate(now,digit).getTime(),now+digit*60_000);
});
test('rejects multiple digits and fractions', () => { for (const n of [10,-1,1.5,NaN,'3']) assert.throws(() => shiftedDate(Date.now(),n),RangeError); });

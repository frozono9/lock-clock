import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shiftedDate, clockText, dateText } from './clock.js';
test('one digit offsets cross midnight and update the date', () => {
  const now = new Date(2026,9,21,23,57,12).getTime();
  const later = shiftedDate(now,9,1);
  assert.equal(clockText(later),'00:06');
  assert.equal(later.getDate(),22);
  assert.match(dateText(later),/Thursday/);
  const earlier = shiftedDate(new Date(2026,9,21,0,2).getTime(),9,-1);
  assert.equal(clockText(earlier),'23:53'); assert.equal(earlier.getDate(),20);
});
test('clock continues to follow elapsed real time and supports 12 hours', () => {
  const now = new Date(2026,9,21,16,52).getTime();
  assert.equal(clockText(shiftedDate(now,5,1)),'16:57');
  assert.equal(clockText(shiftedDate(now+60_000,5,1)),'16:58');
  assert.equal(clockText(shiftedDate(now,5,1),true),'4:57');
});
test('rejects multiple digits and fractions', () => { for (const n of [10,-1,1.5,NaN,'3']) assert.throws(() => shiftedDate(Date.now(),n,1),RangeError); });

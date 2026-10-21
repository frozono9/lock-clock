import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shiftedDate, travelFrame, clockText, dateText } from './clock.js';
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

test('tap waits for the configured delay before beginning to rewind', () => {
  const now = new Date(2026,9,21,18,38).getTime();
  assert.equal(travelFrame(now,3).phase,'ahead');
  const waiting = travelFrame(now+1999,3,1999,2,4);
  assert.equal(waiting.phase,'waiting');
  assert.equal(waiting.date.getTime(),now+1999+180_000);
  const start = travelFrame(now+2000,3,2000,2,4);
  assert.equal(start.phase,'rewinding');
  assert.equal(start.remainingMs,180_000);
});

test('rewind passes through intermediate times and lands on the moving real time', () => {
  const tap = new Date(2026,9,21,18,38,58).getTime();
  const middle = travelFrame(tap+4000,3,4000,2,4);
  assert.equal(middle.phase,'rewinding');
  assert.equal(middle.remainingMs,90_000);
  assert.equal(clockText(middle.date),'18:40');
  const end = travelFrame(tap+6000,3,6000,2,4);
  assert.equal(end.phase,'real');
  assert.equal(end.date.getTime(),tap+6000);
  assert.equal(clockText(end.date),'18:39');
  const resumed = travelFrame(tap+120_000,3,120_000,2,4);
  assert.equal(resumed.date.getTime(),tap+120_000);
  assert.equal(resumed.remainingMs,0);
});

test('countdown never overshoots below real time and supports zero delay', () => {
  const tap = Date.now();
  let previous = Infinity;
  for (let elapsed=0;elapsed<=6000;elapsed+=50) {
    const frame=travelFrame(tap+elapsed,9,elapsed,0,4);
    assert.ok(frame.date.getTime()>=tap+elapsed);
    assert.ok(frame.remainingMs<=previous);
    previous=frame.remainingMs;
  }
  assert.equal(travelFrame(tap,9,0,0,4).phase,'rewinding');
});

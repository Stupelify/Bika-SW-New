import { describe, expect, it } from 'vitest';
import { moneyTone, moneyToneClass } from '../moneyTone';

describe('moneyTone', () => {
  it('classifies by sign', () => {
    expect(moneyTone(1000)).toBe('pos');
    expect(moneyTone(-1)).toBe('neg');
    expect(moneyTone(0)).toBe('neutral');
  });

  it('treats an outstanding balance as a warning when flagged', () => {
    expect(moneyTone(5000, { outstanding: true })).toBe('warn');
    expect(moneyTone(0, { outstanding: true })).toBe('neutral');
  });

  it('maps tone to a css class, empty for neutral', () => {
    expect(moneyToneClass(1000)).toBe('money-pos');
    expect(moneyToneClass(-5)).toBe('money-neg');
    expect(moneyToneClass(0)).toBe('');
    expect(moneyToneClass(5000, { outstanding: true })).toBe('money-warn');
  });
});

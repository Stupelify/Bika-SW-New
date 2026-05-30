// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { focusNextField } from '../focusNextField';

function markVisible(el: HTMLElement): void {
  Object.defineProperty(el, 'offsetWidth', { configurable: true, value: 1 });
}

describe('focusNextField', () => {
  it('focuses the next visible field in tab order', () => {
    const form = document.createElement('form');
    form.innerHTML = `
      <input id="a" type="text" />
      <input id="b" type="text" />
      <input id="c" type="text" />
    `;
    document.body.appendChild(form);

    const a = form.querySelector('#a') as HTMLInputElement;
    const b = form.querySelector('#b') as HTMLInputElement;
    form.querySelectorAll<HTMLElement>('input').forEach(markVisible);
    a.focus();

    const moved = focusNextField(form, a);
    expect(moved).toBe(true);
    expect(document.activeElement).toBe(b);

    form.remove();
  });

  it('returns false when already on the last field', () => {
    const form = document.createElement('form');
    form.innerHTML = `<input id="only" type="text" />`;
    document.body.appendChild(form);
    const only = form.querySelector('#only') as HTMLInputElement;
    markVisible(only);
    only.focus();
    expect(focusNextField(form, only)).toBe(false);
    form.remove();
  });
});

import { describe, it, expect } from 'vitest';
import copyData from '../copyData';

describe('copyData', () => {
  it('deep clones an object', () => {
    const original = { a: 1, b: { c: 2 } };
    const copy = copyData(original);
    expect(copy).toEqual(original);
    expect(copy).not.toBe(original);
    expect(copy.b).not.toBe(original.b);
  });

  it('deep clones an array', () => {
    const original = [1, [2, 3], { a: 4 }];
    const copy = copyData(original);
    expect(copy).toEqual(original);
    expect(copy).not.toBe(original);
  });

  it('handles primitive values', () => {
    expect(copyData(42)).toBe(42);
    expect(copyData('hello')).toBe('hello');
    expect(copyData(true)).toBe(true);
    expect(copyData(null)).toBe(null);
  });

  it('strips undefined values (JSON serialization behavior)', () => {
    const original = { a: 1, b: undefined };
    const copy = copyData(original);
    expect(copy).toEqual({ a: 1 });
    expect('b' in copy).toBe(false);
  });
});

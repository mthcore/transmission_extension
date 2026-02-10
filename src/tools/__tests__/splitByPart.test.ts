import { describe, it, expect } from 'vitest';
import splitByPart from '../splitByPart';

describe('splitByPart', () => {
  it('splits an array into chunks of the specified size', () => {
    expect(splitByPart([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns a single chunk when array is smaller than limit', () => {
    expect(splitByPart([1, 2], 5)).toEqual([[1, 2]]);
  });

  it('returns a single chunk when array length equals limit', () => {
    expect(splitByPart([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
  });

  it('returns empty array for empty input', () => {
    expect(splitByPart([], 3)).toEqual([]);
  });

  it('handles limit of 1', () => {
    expect(splitByPart([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });

  it('does not mutate the original array', () => {
    const original = [1, 2, 3, 4];
    splitByPart(original, 2);
    expect(original).toEqual([1, 2, 3, 4]);
  });
});

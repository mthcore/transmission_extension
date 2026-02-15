import { describe, it, expect } from 'vitest';
import { formatBytes, formatSpeed, speedToStr } from '../format';

describe('formatBytes', () => {
  it('formats zero bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    const result = formatBytes(1024);
    expect(result).toContain('kB');
  });

  it('formats megabytes', () => {
    const result = formatBytes(1048576);
    expect(result).toContain('MB');
  });

  it('formats gigabytes', () => {
    const result = formatBytes(1073741824);
    expect(result).toContain('GB');
  });
});

describe('formatSpeed', () => {
  it('formats zero speed', () => {
    expect(formatSpeed(0)).toBe('0 B/s');
  });

  it('formats speed in kB/s', () => {
    const result = formatSpeed(1024);
    expect(result).toContain('kB/s');
  });

  it('formats speed in MB/s', () => {
    const result = formatSpeed(1048576);
    expect(result).toContain('MB/s');
  });
});

describe('speedToStr', () => {
  it('returns formatted speed for valid number', () => {
    const result = speedToStr(1024);
    expect(result).toContain('kB/s');
  });

  it('returns empty string for Infinity', () => {
    expect(speedToStr(Infinity)).toBe('');
  });

  it('returns empty string for -Infinity', () => {
    expect(speedToStr(-Infinity)).toBe('');
  });

  it('returns empty string for NaN', () => {
    expect(speedToStr(NaN)).toBe('');
  });

  it('formats zero speed', () => {
    expect(speedToStr(0)).toBe('0 B/s');
  });
});

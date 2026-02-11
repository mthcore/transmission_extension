import { describe, it, expect } from 'vitest';
import { arrayBufferToBase64, base64ToArrayBuffer } from '../binaryConversion';

describe('arrayBufferToBase64', () => {
  it('converts an ArrayBuffer to a base64 string', () => {
    const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer; // "Hello"
    expect(arrayBufferToBase64(buffer)).toBe(btoa('Hello'));
  });

  it('handles empty buffer', () => {
    const buffer = new Uint8Array([]).buffer;
    expect(arrayBufferToBase64(buffer)).toBe('');
  });
});

describe('base64ToArrayBuffer', () => {
  it('converts a base64 string to an ArrayBuffer', () => {
    const base64 = btoa('Hello');
    const buffer = base64ToArrayBuffer(base64);
    const bytes = new Uint8Array(buffer);
    expect(Array.from(bytes)).toEqual([72, 101, 108, 108, 111]);
  });

  it('handles empty string', () => {
    const buffer = base64ToArrayBuffer(btoa(''));
    expect(new Uint8Array(buffer).length).toBe(0);
  });
});

describe('roundtrip', () => {
  it('encodes and decodes back to the same data', () => {
    const original = new Uint8Array([0, 1, 127, 128, 255]);
    const base64 = arrayBufferToBase64(original.buffer);
    const decoded = new Uint8Array(base64ToArrayBuffer(base64));
    expect(Array.from(decoded)).toEqual(Array.from(original));
  });
});

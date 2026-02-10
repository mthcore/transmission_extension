import { describe, it, expect } from 'vitest';
import ErrorWithCode from '../ErrorWithCode';

describe('ErrorWithCode', () => {
  it('creates an error with a message', () => {
    const err = new ErrorWithCode('something failed');
    expect(err.message).toBe('something failed');
    expect(err.code).toBeUndefined();
  });

  it('creates an error with a message and code', () => {
    const err = new ErrorWithCode('not found', 'NOT_FOUND');
    expect(err.message).toBe('not found');
    expect(err.code).toBe('NOT_FOUND');
  });

  it('is an instance of Error', () => {
    const err = new ErrorWithCode('test');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ErrorWithCode);
  });

  it('has a name property', () => {
    const err = new ErrorWithCode('test');
    expect(err.name).toBe('Error');
  });
});

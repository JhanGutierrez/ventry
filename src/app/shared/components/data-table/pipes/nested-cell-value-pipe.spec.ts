import { NestedCellValuePipe } from "./nested-cell-value-pipe";

describe('NestedCellValuePipe', () => {
  let pipe: NestedCellValuePipe;

  beforeEach(() => {
    pipe = new NestedCellValuePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return a top-level property', () => {
    const obj = { name: 'Alice' };
    expect(pipe.transform(obj, 'name')).toBe('Alice');
  });

  it('should return a nested property', () => {
    const obj = { user: { profile: { age: 30 } } };
    expect(pipe.transform(obj, 'user.profile.age')).toBe(30);
  });

  it('should return undefined for non-existent property', () => {
    const obj = { user: {} };
    expect(pipe.transform(obj, 'user.address.street')).toBeUndefined();
  });

  it('should handle null/undefined input gracefully', () => {
    expect(pipe.transform(null, 'anything')).toBeUndefined();
    expect(pipe.transform(undefined, 'nested.key')).toBeUndefined();
  });

  it('should return the whole object when path is empty', () => {
    const obj = { test: 123 };
    expect(pipe.transform(obj, '')).toEqual(obj);
  });
});

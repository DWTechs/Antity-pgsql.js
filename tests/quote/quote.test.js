import { quoteIfUppercase } from '../../build/es6/crud/quote.js';

describe('quoteIfUppercase', () => {

  it('should return a lowercase non-reserved word as-is', () => {
    expect(quoteIfUppercase('name')).toBe('name');
  });

  it('should return an empty string as-is', () => {
    expect(quoteIfUppercase('')).toBe('');
  });

  it('should wrap a word containing uppercase letters in double quotes', () => {
    expect(quoteIfUppercase('maxLevel')).toBe('"maxLevel"');
  });

  it('should wrap an all-uppercase word in double quotes', () => {
    expect(quoteIfUppercase('ID')).toBe('"ID"');
  });

  it('should wrap a reserved word in double quotes', () => {
    expect(quoteIfUppercase('default')).toBe('"default"');
    expect(quoteIfUppercase('order')).toBe('"order"');
    expect(quoteIfUppercase('select')).toBe('"select"');
    expect(quoteIfUppercase('table')).toBe('"table"');
  });

  it('should treat reserved word check as case-insensitive', () => {
    expect(quoteIfUppercase('FROM')).toBe('"FROM"');
    expect(quoteIfUppercase('Where')).toBe('"Where"');
  });

  it('should escape an internal double-quote character by doubling it', () => {
    expect(quoteIfUppercase('Max"Level')).toBe('"Max""Level"');
  });

  it('should escape multiple internal double-quote characters', () => {
    expect(quoteIfUppercase('A"B"C')).toBe('"A""B""C"');
  });

  it('should not allow SQL injection via a double-quote in a quoted identifier', () => {
    // Without escaping this would produce: "name" --" which breaks out
    const malicious = 'Name" --';
    expect(quoteIfUppercase(malicious)).toBe('"Name"" --"');
  });

});

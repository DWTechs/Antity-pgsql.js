import { SQLEntity, Property } from '../../dist/antity-pgsql.js';

describe('SQLEntity.createProperty', () => {
  const makeEntity = (extra = {}) => new SQLEntity('persons', [
    {
      key: 'id',
      type: 'integer',
      min: 1,
      max: 999999999,
      isTypeChecked: true,
      isFilterable: true,
      requiredFor: [],
      operations: ['SELECT'],
      isPrivate: false,
      sanitizer: null,
      normalizer: null,
      validator: null,
      ...extra,
    }
  ], 'app');

  it('should build antity-pgsql\'s own Property subclass, not the base one', () => {
    const entity = makeEntity();
    expect(entity.properties[0]).toBeInstanceOf(Property);
  });

  it('should still validate/default isFilterable and operations', () => {
    const entity = makeEntity({ isFilterable: true, operations: ['SELECT', 'UPDATE'] });
    expect(entity.properties[0].isFilterable).toBe(true);
    expect(entity.properties[0].operations).toEqual(['SELECT', 'UPDATE']);
  });

  it('should default readOnly to false when omitted', () => {
    const entity = makeEntity();
    expect(entity.properties[0].readOnly).toBe(false);
  });

  it('should keep readOnly: true when provided', () => {
    const entity = makeEntity({ readOnly: true });
    expect(entity.properties[0].readOnly).toBe(true);
  });

  it('should not crash when operations is omitted, and should default it to an empty array (regression: the constructor used to re-loop over the raw, pre-default input to wire up mapProps/logSummary, so an omitted operations crashed with "operations is not iterable" even though the constructed Property correctly defaults it to [])', () => {
    const entity = makeEntity({ operations: undefined });
    expect(entity.properties[0].operations).toEqual([]);
  });
});

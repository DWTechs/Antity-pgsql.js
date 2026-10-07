import { SQLEntity, Property } from '../../dist/antity-pgsql.js';
import { log } from '@dwtechs/winstan';

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

  it('should keep isPrivate and requiredFor distinct (base and subclass constructors must agree on parameter order)', () => {
    const entity = makeEntity({ isPrivate: true, requiredFor: ['POST'] });
    expect(entity.properties[0].isPrivate).toBe(true);
    expect(entity.properties[0].requiredFor).toEqual(['POST']);
    expect(entity.privateProps).toEqual(['id']);
    const plain = makeEntity({ isPrivate: false, requiredFor: ['PUT', 'POST'] });
    expect(plain.properties[0].isPrivate).toBe(false);
    expect(plain.properties[0].requiredFor).toEqual(['PUT', 'POST']);
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

  describe('unknown property fields', () => {
    const warnings = (spy) => spy.mock.calls.map(([m]) => (typeof m === 'function' ? m() : m));
    let warn;
    beforeEach(() => { warn = jest.spyOn(log, 'warn').mockImplementation(() => {}); });
    afterEach(() => warn.mockRestore());

    it('should not warn for isFilterable/operations (declared by SQLEntity)', () => {
      makeEntity({ isFilterable: true, operations: ['SELECT'] });
      expect(warnings(warn).filter((m) => m.includes('Unknown field'))).toHaveLength(0);
    });

    it('should warn about a misspelled field and still copy it', () => {
      const entity = makeEntity({ filterable: false, privateField: true });
      const msgs = warnings(warn).filter((m) => m.includes('Unknown field'));
      expect(msgs).toHaveLength(2);
      expect(msgs[0]).toContain('"filterable" on property "id" of entity "persons"');
      expect(entity.properties[0].filterable).toBe(false);
    });
  });
});

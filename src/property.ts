
import { Property as BaseProperty } from '@dwtechs/antity';
import type { Type, Method } from '@dwtechs/antity';
import type { Operation } from './types';

export class Property extends BaseProperty {
  isFilterable: boolean;
  operations: Operation[];

  constructor(
    key: string,
    type: Type,
    min: number | Date | null,
    max: number | Date | null,
    requiredFor: Method[],
    isPrivate: boolean,
    isTypeChecked: boolean,
    isFilterable: boolean,
    operations: Operation[] = [],
    sanitizer: ((v: unknown) => unknown) | null,
    normalizer: ((v: unknown) => unknown) | null,
    validator: ((v: unknown) => unknown) | null,
  ) {
    super(
      key,
      type,
      min,
      max,
      isPrivate,
      requiredFor,
      isTypeChecked,
      sanitizer,
      normalizer,
      validator
    );
    this.isFilterable = isFilterable;
    this.operations = operations;
  }
}
  
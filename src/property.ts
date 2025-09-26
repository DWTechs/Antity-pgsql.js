
import { Property as BaseProperty } from '@dwtechs/antity';
import type { Type, Method } from '@dwtechs/antity';
import type { Operation } from './types';

export class Property extends BaseProperty {
  filter: boolean;
  operations: Operation[];

  constructor(
    key: string,
    type: Type,
    min: number | Date | null,
    max: number | Date | null,
    required: boolean,
    safe: boolean,
    typeCheck: boolean,
    filter: boolean,
    methods: Method[],
    operations: Operation[] = [],
    sanitize: boolean,
    normalize: boolean,
    validate: boolean,
    sanitizer: ((v:any) => any) | null,
    normalizer: ((v:any) => any) | null,
    validator: ((v:any) => any) | null,
  ) {
    super(
      key,
      type,
      min,
      max,
      required,
      safe,
      typeCheck,
      methods,
      sanitize,
      normalize,
      validate,
      sanitizer,
      normalizer,
      validator
    );
    this.filter = filter;
    this.operations = operations;
  }
}
  
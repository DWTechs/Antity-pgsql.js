
import { Property as BaseProperty } from '@dwtechs/Antity.js';
import type { Type, Method, Operation } from '@dwtechs/Antity.js';

export class Property extends BaseProperty {
  operations: Operation[];

  constructor(
    key: string,
    type: Type,
    min: number | Date | null,
    max: number | Date | null,
    required: boolean,
    safe: boolean,
    typeCheck: boolean,
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
    this.operations = operations;
  }
}
  
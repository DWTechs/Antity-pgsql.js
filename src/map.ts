import type { Type } from "@dwtechs/antity";
import type { MappedType } from "./types";

/**
 * transform from entity type to valid sql filter type
 *
 * @param type - The type to be mapped. 
 *
 * @returns The corresponding MappedType as a string, number, or date.
 * - Returns string if it does not match any of the predefined types.
 */
function type(type: Type): MappedType {
  const s = "string";
  const n = "number";
  const d = "date";
  switch (type) {
    case "integer": 
      return n;
    case "float": 
      return n;
    case "even": 
      return n;
    case "odd": 
      return n;
    case "positive": 
      return n;
    case "negative": 
      return n;
    case "powerOfTwo": 
      return n;
    case "ascii": 
      return n;
    case "jwt": 
      return s;
    case "symbol": 
      return s;
    case "password": 
      return s;
    case "email": 
      return s;
    case "regex": 
      return s;
    case "ipAddress": 
      return s;
    case "slug": 
      return s;
    case "hexadecimal": 
      return s;
    case "date": 
      return d;
    case "timestamp": 
      return d;
    case "function": 
      return s;
    case "htmlElement": 
      return s;
    case "htmlEventAttribute": 
      return s;
    case "node": 
      return s;
    case "json": 
      return s;
    case "object": 
      return s;
    default:
      return s;
  }
}

export {
  type,
};

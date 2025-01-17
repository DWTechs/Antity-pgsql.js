import type { MatchMode, Comparator, Type } from "./types";

function index(i: number, matchMode: MatchMode | undefined): any {
  switch (matchMode) {
    case "startsWith":
      return `$${i}%`;
    case "endsWith":
      return `%$${i}`;
    case "contains":
      return `%$${i}%`;
    case "notContains":
      return `%$${i}%`;
    default:
      return `$${i}`;
  }
}


function comparator(matchMode: MatchMode | undefined): Comparator| null {
  switch (matchMode) {
    case "startsWith":
      return "LIKE";
    case "endsWith":
      return "LIKE";
    case "contains":
      return "LIKE";
    case "notContains":
      return "NOT LIKE";
    case "equals": 
      return "=";
    case "notEquals":
      return "<>";
    case "in":
      return "IN";
    case "lt":
      return "<";
    case "lte":
      return "<=";
    case "gt":
      return ">";
    case "gte":
      return ">=";
    case "is":
      return "IS";
    case "isNot":
      return "IS NOT";
    case "before":
      return "<";
    case "after":
      return ">";
    default:
      return null;
  }
}

function type(type: Type): Type {
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
      return type;
  }
}

export default {
  index,
  comparator,
  type,
};

export type Filters = {
  [key: string]: Filter;
}

export type Filter = {
  value: string | number | boolean | Date | number[];
  subProps?: string[];
  matchMode?: MatchMode;
}

export type Comparator = 
  "=" |
  "<" |
  ">" |
  "<=" |
  ">=" |
  "<>" |
  "IS" |
  "IS NOT" |
  "IN" |
  "LIKE" |
  "NOT LIKE";

export type MatchMode =  
  "startsWith" | 
  "endsWith" |
  "contains" |
  "notContains" |
  "equals" |
  "notEquals" |
  "between" |
  "in" |
  "lt" |
  "lte" |
  "gt" |
  "gte" |
  "is" |
  "isNot" |
  "before" |
  "after" |
  "st_contains" |
  "st_dwithin";

  export type Type =  
  "boolean" | 
  "string" | 
  "number" | 
  "integer" | 
  "float" |
  "even" |
  "odd" |
  "positive" |
  "negative" |
  "powerOfTwo" |
  "ascii" |
  "array" |
  "jwt" |
  "symbol" |
  "email" |
  "regex" |
  "json" |
  "ipAddress" |
  "slug" |
  "hexadecimal" |
  "date" |
  "timestamp" |
  "function" |
  "htmlElement" |
  "htmlEventAttribute" |
  "node" |
  "object" |
  "geometry";

export type Clause = {
  conditions: string;
  args: any[];
}

export type Geometry = { 
  lng: number,
  lat: number,
  radius: number,
  bounds: {
    minLng: number,
    minLat: number,
    maxLng: number,
    maxLat: number
  } 
};

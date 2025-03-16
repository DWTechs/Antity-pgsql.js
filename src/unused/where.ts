// import { isProperty, isNil, isString, isNumber, isBoolean, isArray, isObject } from "@dwtechs/checkard";
// import { log } from "@dwtechs/winstan";
// import type { Clause, MatchMode, Type, Filter } from "./types";
// import { mapType, mapComparator, mapValue } from "./map";
// import { checkMatchMode } from "./check";



// const defaultOperator = "AND";


// // returns filters as string in a where clause and the associated array of arguments
// function clause(
//   first: number,
//   rows: number,
//   sortOrder: string,
//   sortField: string,
//   filters: any,
// ): Clause {

//   let conditions = "";
//   let i = 0;
//   const args = [];

//   if (!filters)
//     return { conditions, args };

//   for (const key in filters) {
//     const filter = filters[key];
//     let newCondition: string | null = null;
//     // prepare property name for sql query
//     const sqlKey = `\"${key}\"`;
//     const { value, subProps, matchMode } = filter;
    
//     const type = mapType(propType);
//     if (!checkMatchMode(type, matchMode)) {
//       log.info(`Invalid match mode: ${matchMode} for type: ${type} at property: ${propName}`);
//       return null;
//     }

//     newCondition = addCondition(sqlKey, value, subProps, matchMode, args, i);
//     if (newCondition)
//       conditions += `${newCondition} ${defaultOperator}`;

//     // if (isArray(filter)) {
//     //   const conditions = buildConditions(p, filter, args);
//     //   if (conditions.length > 1) {
//     //     const operator = filter[0]?.operator ?? defaultOperator;
//     //     newCond = ` (${conditions.join(` ${operator} `)}) `;
//     //   } else
//     //     newCond = ` ${conditions.toString()} `;
//     // } else {
    
//   }

//   conditions = where(conditions);
//   conditions += orderBy(sortField, sortOrder);
//   conditions += limit(rows, first);
//   i = 1;

//   return { conditions, args };
// }

// // function buildConditions(propName: string, arrayVal: any[], args: any[]): any[] {
// //   const conds = [];
// //   for (const filter of arrayVal) {
// //     const { value, matchMode } = filter;
// //     conds.push(addCondition(prop, value, null, matchMode, args));
// //   }
// //   return conds;
// // }

// function addCondition(propName: string, propType: Type, val: any, subProps: any, matchMode: MatchMode, args: any[]): string | null {

//   const type = mapType(propType);
  
//   if (!checkMatchMode(type, matchMode)) {
//     log.info(`Invalid match mode: ${matchMode} for type: ${type} at property: ${propName}`);
//     return null;
//   }

//   const comparator = mapComparator(matchMode);
//   if (comparator) {
//     const mappedValue = mapValue(val, matchMode);
//     args.push(mappedValue);
//     return `${propName} ${comparator} $${i++}`;
//   }

//   return null;
  


//   // if aggregated column name ends with "JsonAgg"
//   // it is an aggregate of json objects
//   // if (propName.endsWith('JsonAgg"')) {
//   //   condition = prepare.jsonAgg(propName, subProps, val, args, matchMode);
//   // }
//   // if aggregated column name ends with "ArrayAgg"
//   // it is an aggregate of integers
//   // else if (propName.endsWith('ArrayAgg"'))
//   //   condition = prepare.arrayAgg(prop, val, args);
//   // else if (isDateMatchMode(matchMode))
//   //   condition = prepare.dateAdvanced(prop, val, matchMode, args);
//   // // interval
//   // else if (matchMode === "between")
//   //   condition = prepare.interval(prop, val, args); //dates
//   // lower than or equal to
//   // else if (matchMode === "lte")
//   //   condition = prepare.lte(prop, val, args); //dates
//   // greater than or equal to
//   // else if (matchMode === "gte")
//   //   condition = prepare.gte(prop, val, args); //dates
//   // else {
//     // geom
//     // if (prop === '"geom"') condition = prepare.geometry(val);
//     // null
//   //   else if (isNil(val)) condition = prepare.nil(prop, matchMode);
//   //   // bool
//   //   else if (isBoolean(val)) condition = prepare.boolean(prop, val);
//   //   // number
//   //   else if (isNumber(val, false)) condition = prepare.number(prop, val);
//   //   // string
//   //   else if (isString(val) && val)
//   //     condition = prepare.string(prop, val, args, matchMode);
//   //   //object
//   //   else if (isObject(val, true))
//   //     condition = prepare.object(prop, val, args, matchMode);
//   //   // array
//   //   else if (isArray(val)) condition = prepare.array(prop, val);
//   // //}
//   // return condition;
// }

// function isDateMatchMode(matchMode: MatchMode): boolean {
//   return ["dateIs", "dateIsNot", "dateBefore", "dateAfter"].includes(matchMode);
// }

// export default {
//   clause,
// };

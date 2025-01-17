
// Builds where clause
function where(conditions: string, operator): string {
    return conditions
      ? ` WHERE ${conditions.slice(0, -(operator.length + 1)).trim()}`
      : "";
  }

  // Adds order by clause
function orderBy(sortField: string, sortOrder: string): string {
    return sortField ? ` ORDER BY "${sortField}" ${sortOrder}` : "";
  }

  // Adds limit clause
function limit(rows: number, first: number): string {
    return rows ? ` LIMIT ${rows} OFFSET ${first}` : "";
  }

export {
  where,
  orderBy,
  limit,
};

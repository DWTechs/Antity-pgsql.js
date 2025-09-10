const reserved = [
  'all', 'analyse', 'analyze', 'and', 'any', 'array', 'as', 'asc', 'asymmetric',
  'authorization', 'between', 'binary', 'both', 'case', 'cast', 'check', 'collate',
  'column', 'constraint', 'create', 'cross', 'current_catalog', 'current_date',
  'current_role', 'current_schema', 'current_time', 'current_timestamp', 'current_user',
  'default', 'deferrable', 'desc', 'distinct', 'do', 'else', 'end', 'except', 'false',
  'fetch', 'for', 'foreign', 'from', 'full', 'grant', 'group', 'having', 'ilike', 'in',
  'initially', 'inner', 'intersect', 'into', 'is', 'isnull', 'join', 'lateral', 'leading',
  'left', 'like', 'limit', 'localtime', 'localtimestamp', 'natural', 'not', 'notnull',
  'null', 'offset', 'on', 'only', 'or', 'order', 'outer', 'overlaps', 'placing', 'primary',
  'references', 'returning', 'right', 'select', 'session_user', 'similar', 'some', 'symmetric',
  'table', 'tablesample', 'then', 'to', 'trailing', 'true', 'union', 'unique', 'user', 'using',
  'variadic', 'verbose', 'when', 'where', 'window', 'with'
];

/**
 * Add quotes around a word if it contains uppercase letters.
 * 
 * @param {string} word - The word to process
 * @returns {string} The word with quotes around it if it contains uppercase letters, otherwise the original word
 */
function quoteIfUppercase(word: string): string {
  if (/[A-Z]/.test(word) || reserved.includes(word.toLowerCase()))
    return `"${word}"`;
  return word;
}

export { quoteIfUppercase };
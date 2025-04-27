/**
 * Add quotes around a word if it contains uppercase letters.
 * 
 * @param {string} word - The word to process
 * @returns {string} The word with quotes around it if it contains uppercase letters, otherwise the original word
 */
function quoteIfUppercase(word: string): string {
  if (/[A-Z]/.test(word))
    return `"${word}"`;
  return word;
}

export { quoteIfUppercase };
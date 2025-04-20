
  /**
  * Generates a PostgreSQL query string with placeholders for a given quantity of values.
  *
  * @param {number} qty - The quantity of values to generate placeholders for.
  * @return {string} The generated query string with placeholders.
  */
  function $i(qty: number, start: number): string {
    return `(${Array.from({ length: qty }, (_, i) => `$${start +i + 1}`).join(", ")})`;
  }

  export { $i };

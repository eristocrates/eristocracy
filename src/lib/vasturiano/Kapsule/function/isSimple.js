
/**
 * Determine if a value is simple enough for data attributes
 * @param {any} value - Value to check
 * @returns {boolean} True if value can be serialized to data attribute
 */
export function isSimple(value) {
  const type = typeof value;
  return (
    type === 'string' ||
    type === 'number' ||
    type === 'boolean' ||
    value === null ||
    value === undefined ||
    (Array.isArray(value) && value.every(isSimple)) // Simple arrays
  );
}

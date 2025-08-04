import { isSimple } from './isSimple.js';

/**
 * Categorize props into simple (data attributes) and complex (define:vars)
 * @param {Record<string, any>} props - Props object to categorize
 * @returns {{ simple: Record<string, any>, complex: Record<string, any> }} categorized props
 */
export function categorizeProps(props) {
  const simple = {};
  const complex = {};

  Object.entries(props).forEach(([key, value]) => {
    if (isSimple(value)) {
      simple[key] = value;
    } else {
      complex[key] = value;
    }
  });

  return { simple, complex };
}

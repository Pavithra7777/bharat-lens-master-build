/**
 * PostgreSQL array columns (text[]) are returned from PGlite as strings
 * in the format '{"value1","value2"}' or '{value1,value2}'.
 * This utility safely parses them into JS arrays.
 */
export function parsePgArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== 'string') return [];
  try {
    // PostgreSQL arrays are enclosed in {} — strip them and split
    const inner = value.replace(/^\{|\}$/g, '').trim();
    if (!inner) return [];
    // Handle quoted values: "foo","bar" and unquoted: foo,bar
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < inner.length; i++) {
      const ch = inner[i];
      if (ch === '"') {
        if (inQuotes && inner[i - 1] === '\\') {
          current = current.slice(0, -1) + '"';
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        parts.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    if (current || parts.length > 0) parts.push(current.trim());
    return parts.filter(Boolean);
  } catch {
    return [];
  }
}

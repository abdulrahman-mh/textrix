/**
 * Check if object1 includes object2
 */
export function objectIncludes(object1: Record<string, any>, object2: Record<string, any>): boolean {
  const keys = Object.keys(object2);
  if (!keys.length) return true;
  return keys.every((key) => object2[key] === object1[key]);
}

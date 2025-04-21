import type { Step, Transform } from 'prosemirror-transform';
import type { ChangedRange, Range } from '../types';

/**
 * Removes duplicate values within an array.
 * Supports numbers, strings, and objects.
 *
 * @param array The input array to remove duplicates from.
 * @param by A function to generate a unique key for each element. Defaults to JSON.stringify.
 * @returns A new array with duplicates removed.
 */
export function removeDuplicates<T>(array: T[], by: (item: T) => string = JSON.stringify): T[] {
  const seen = new Set<string>();

  return array.filter((item) => {
    const key = by(item);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

/**
 * Removes duplicated ranges and ranges that are
 * fully captured by other ranges.
 */
function simplifyChangedRanges(changes: ChangedRange[]): ChangedRange[] {
  const uniqueChanges = removeDuplicates(changes);

  return uniqueChanges.length === 1
    ? uniqueChanges
    : uniqueChanges.filter((change, index) => {
        const rest = uniqueChanges.filter((_, i) => i !== index);

        return !rest.some((otherChange) => {
          return (
            change.oldRange.from >= otherChange.oldRange.from &&
            change.oldRange.to <= otherChange.oldRange.to &&
            change.newRange.from >= otherChange.newRange.from &&
            change.newRange.to <= otherChange.newRange.to
          );
        });
      });
}

/**
 * Returns a list of changed ranges
 * based on the first and last state of all steps.
 */
export function getChangedRanges(transform: Transform): ChangedRange[] {
  const { mapping, steps } = transform;
  const changes: ChangedRange[] = [];

  mapping.maps.forEach((stepMap, index) => {
    const ranges: Range[] = [];

    // This accounts for step changes where no range was actually altered
    // e.g. when setting a mark, node attribute, etc.
    // @ts-ignore
    if (!stepMap.ranges.length) {
      const { from, to } = steps[index] as Step & {
        from?: number;
        to?: number;
      };

      if (from === undefined || to === undefined) {
        return;
      }

      ranges.push({ from, to });
    } else {
      stepMap.forEach((from, to) => {
        ranges.push({ from, to });
      });
    }

    for (const { from, to } of ranges) {
      const newStart = mapping.slice(index).map(from, -1);
      const newEnd = mapping.slice(index).map(to);

      const invertedMapping = mapping.invert();
      const oldStart = invertedMapping.map(newStart, -1);
      const oldEnd = invertedMapping.map(newEnd);

      changes.push({
        oldRange: { from: oldStart, to: oldEnd },
        newRange: { from: newStart, to: newEnd },
      });
    }
  });

  return simplifyChangedRanges(changes);
}

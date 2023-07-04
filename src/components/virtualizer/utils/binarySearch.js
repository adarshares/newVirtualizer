export const binarySearch = (lo, hi, cellMetaDataMap, offset, initializer) => {
  let index = initializer;
  while (hi >= lo) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (cellMetaDataMap.get(mid).offset >= offset) {
      index = mid;
      hi = index - 1;
    } else {
      lo = index + 1;
    }
  }
  return Math.max(index - 1, 0);
};

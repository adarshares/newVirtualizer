import { binarySearch } from "./binarySearch";
export const findLastIndex = (cellCount, cellMetaDataMap, offset, length) => {
  return binarySearch(
    0,
    cellCount - 1,
    cellMetaDataMap,
    offset + length,
    cellCount - 1
  );
};

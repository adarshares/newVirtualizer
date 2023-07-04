import { binarySearch } from "./binarySearch";
export const findFirstIndex = (cellCount, cellMetaDataMap, offset) => {
  return binarySearch(0, cellCount - 1, cellMetaDataMap, offset, 0);
};

import { getItemMetadata } from "./metaDataManager";
import { findNearestItem } from "./metaDataManager";

export const getColumnStartIndexForOffset = (
  props,
  scrollLeft,
  instanceProps
) => findNearestItem("column", props, instanceProps, scrollLeft);

export const getColumnStopIndexForStartIndex = (
  props,
  startIndex,
  scrollLeft,
  instanceProps
) => {
  const { columnCount, width } = props;

  const itemMetadata = getItemMetadata(
    "column",
    props,
    startIndex,
    instanceProps
  );
  const maxOffset = scrollLeft + width;

  let offset = itemMetadata.offset + itemMetadata.size;
  let stopIndex = startIndex;

  while (stopIndex < columnCount - 1 && offset < maxOffset) {
    stopIndex++;
    offset += getItemMetadata("column", props, stopIndex, instanceProps).size;
  }

  return stopIndex;
};

export const getRowStartIndexForOffset = (props, scrollTop, instanceProps) =>
  findNearestItem("row", props, instanceProps, scrollTop);

export const getRowStopIndexForStartIndex = (
  props,
  startIndex,
  scrollTop,
  instanceProps
) => {
  const { rowCount, height } = props;

  const itemMetadata = getItemMetadata("row", props, startIndex, instanceProps);
  const maxOffset = scrollTop + height;

  let offset = itemMetadata.offset + itemMetadata.size;
  let stopIndex = startIndex;

  while (stopIndex < rowCount - 1 && offset < maxOffset) {
    stopIndex++;
    offset += getItemMetadata("row", props, stopIndex, instanceProps).size;
  }

  return stopIndex;
};

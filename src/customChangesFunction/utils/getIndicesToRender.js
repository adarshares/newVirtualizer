import { getItemMetadata } from "./metaDataManager";
import { findNearestItem } from "./metaDataManager";

export const getColumnStartIndexForOffset = ({
  columnWidth,
  rowHeight,
  columnCount,
  rowCount,
  scrollLeft,
  instanceProps,
}) =>
  findNearestItem({
    itemType: "column",
    columnWidth,
    rowHeight,
    columnCount,
    rowCount,
    instanceProps,
    offset: scrollLeft,
  });

export const getColumnStopIndexForStartIndex = ({
  columnCount,
  width,
  columnWidth,
  rowHeight,
  startIndex,
  scrollLeft,
  instanceProps,
}) => {
  const itemMetadata = getItemMetadata({
    itemType: "column",
    columnWidth,
    rowHeight,
    index: startIndex,
    instanceProps,
  });
  const maxOffset = scrollLeft + width;

  let offset = itemMetadata.offset + itemMetadata.size;
  let stopIndex = startIndex;

  while (stopIndex < columnCount - 1 && offset < maxOffset) {
    stopIndex++;
    offset += getItemMetadata({
      itemType: "column",
      columnWidth,
      rowHeight,
      index: stopIndex,
      instanceProps,
    }).size;
  }

  return stopIndex;
};

export const getRowStartIndexForOffset = ({
  columnWidth,
  rowHeight,
  columnCount,
  rowCount,
  scrollTop,
  instanceProps,
}) =>
  findNearestItem({
    itemType: "row",
    columnWidth,
    rowHeight,
    columnCount,
    rowCount,
    instanceProps,
    offset: scrollTop,
  });

export const getRowStopIndexForStartIndex = (
  rowCount,
  height,
  columnWidth,
  rowHeight,
  startIndex,
  scrollTop,
  instanceProps
) => {
  const itemMetadata = getItemMetadata({
    itemType: "row",
    columnWidth,
    rowHeight,
    index: startIndex,
    instanceProps,
  });
  const maxOffset = scrollTop + height;

  let offset = itemMetadata.offset + itemMetadata.size;
  let stopIndex = startIndex;

  while (stopIndex < rowCount - 1 && offset < maxOffset) {
    stopIndex++;
    offset += getItemMetadata({
      itemType: "row",
      columnWidth,
      rowHeight,
      index: stopIndex,
      instanceProps,
    }).size;
  }

  return stopIndex;
};

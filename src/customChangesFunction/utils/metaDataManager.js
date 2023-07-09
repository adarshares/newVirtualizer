import {
  getEstimatedTotalHeight,
  getEstimatedTotalWidth,
} from "./getEstimatedTotalSize";

export const getItemMetadata = ({
  itemType,
  columnWidth,
  rowHeight,
  index,
  virtualizationParams,
}) => {
  let itemMetadataMap, itemSize, lastMeasuredIndex;
  if (itemType === "column") {
    itemMetadataMap = virtualizationParams.columnMetadataMap;
    itemSize = columnWidth;
    lastMeasuredIndex = virtualizationParams.lastMeasuredColumnIndex;
  } else {
    itemMetadataMap = virtualizationParams.rowMetadataMap;
    itemSize = rowHeight;
    lastMeasuredIndex = virtualizationParams.lastMeasuredRowIndex;
  }

  if (index > lastMeasuredIndex) {
    let offset = 0;
    if (lastMeasuredIndex >= 0) {
      const itemMetadata = itemMetadataMap[lastMeasuredIndex];
      offset = itemMetadata.offset + itemMetadata.size;
    }

    for (let i = lastMeasuredIndex + 1; i <= index; i++) {
      let size = itemSize(i);

      itemMetadataMap[i] = {
        offset,
        size,
      };

      offset += size;
    }

    if (itemType === "column") {
      virtualizationParams.lastMeasuredColumnIndex = index;
    } else {
      virtualizationParams.lastMeasuredRowIndex = index;
    }
  }

  return itemMetadataMap[index];
};

export const findNearestItem = ({
  itemType,
  columnWidth,
  rowHeight,
  columnCount,
  rowCount,
  virtualizationParams,
  offset,
}) => {
  let itemMetadataMap, lastMeasuredIndex;
  if (itemType === "column") {
    itemMetadataMap = virtualizationParams.columnMetadataMap;
    lastMeasuredIndex = virtualizationParams.lastMeasuredColumnIndex;
  } else {
    itemMetadataMap = virtualizationParams.rowMetadataMap;
    lastMeasuredIndex = virtualizationParams.lastMeasuredRowIndex;
  }

  const lastMeasuredItemOffset =
    lastMeasuredIndex > 0 ? itemMetadataMap[lastMeasuredIndex].offset : 0;

  if (lastMeasuredItemOffset >= offset) {
    // If we've already measured items within this range just use a binary search as it's faster.
    return findNearestItemBinarySearch(
      itemType,
      columnWidth,
      rowHeight,
      virtualizationParams,
      lastMeasuredIndex,
      0,
      offset
    );
  } else {
    // If we haven't yet measured this high, fallback to an exponential search with an inner binary search.
    // The exponential search avoids pre-computing sizes for the full set of items as a binary search would.
    // The overall complexity for this approach is O(log n).
    return findNearestItemExponentialSearch(
      itemType,
      columnWidth,
      rowHeight,
      columnCount,
      rowCount,
      virtualizationParams,
      Math.max(0, lastMeasuredIndex),
      offset
    );
  }
};

export const findNearestItemBinarySearch = (
  itemType,
  columnWidth,
  rowHeight,
  virtualizationParams,
  high,
  low,
  offset
) => {
  while (low <= high) {
    const middle = low + Math.floor((high - low) / 2);
    const currentOffset = getItemMetadata({
      itemType,
      columnWidth,
      rowHeight,
      index: middle,
      virtualizationParams,
    }).offset;

    if (currentOffset === offset) {
      return middle;
    } else if (currentOffset < offset) {
      low = middle + 1;
    } else if (currentOffset > offset) {
      high = middle - 1;
    }
  }

  if (low > 0) {
    return low - 1;
  } else {
    return 0;
  }
};

export const findNearestItemExponentialSearch = (
  itemType,
  columnWidth,
  rowHeight,
  columnCount,
  rowCount,
  virtualizationParams,
  index,
  offset
) => {
  const itemCount = itemType === "column" ? columnCount : rowCount;
  let interval = 1;

  while (
    index < itemCount &&
    getItemMetadata({
      itemType,
      columnWidth,
      rowHeight,
      index,
      virtualizationParams,
    }).offset < offset
  ) {
    index += interval;
    interval *= 2;
  }

  return findNearestItemBinarySearch(
    itemType,
    columnWidth,
    rowHeight,
    virtualizationParams,
    Math.min(index, itemCount - 1),
    Math.floor(index / 2),
    offset
  );
};

export const getOffsetForIndexAndAlignment = (
  itemType,
  width,
  height,
  columnWidth,
  rowHeight,
  columnCount,
  rowCount,
  index,
  align,
  scrollOffset,
  virtualizationParams,
  scrollbarSize
) => {
  const size = itemType === "column" ? width : height;
  const itemMetadata = getItemMetadata({
    itemType,
    columnWidth,
    rowHeight,
    index,
    virtualizationParams,
  });

  // Get estimated total size after ItemMetadata is computed,
  // To ensure it reflects actual measurements instead of just estimates.
  const estimatedTotalSize =
    itemType === "column"
      ? getEstimatedTotalWidth({ columnCount }, virtualizationParams)
      : getEstimatedTotalHeight({ rowCount }, virtualizationParams);

  const maxOffset = Math.max(
    0,
    Math.min(estimatedTotalSize - size, itemMetadata.offset)
  );
  const minOffset = Math.max(
    0,
    itemMetadata.offset - size + scrollbarSize + itemMetadata.size
  );

  if (align === "smart") {
    if (scrollOffset >= minOffset - size && scrollOffset <= maxOffset + size) {
      align = "auto";
    } else {
      align = "center";
    }
  }

  switch (align) {
    case "start":
      return maxOffset;
    case "end":
      return minOffset;
    case "center":
      return Math.round(minOffset + (maxOffset - minOffset) / 2);
    case "auto":
    default:
      if (scrollOffset >= minOffset && scrollOffset <= maxOffset) {
        return scrollOffset;
      } else if (minOffset > maxOffset) {
        // Because we only take into account the scrollbar size when calculating minOffset
        // this value can be larger than maxOffset when at the end of the list
        return minOffset;
      } else if (scrollOffset < minOffset) {
        return minOffset;
      } else {
        return maxOffset;
      }
  }
};

export const getOffsetForColumnAndAlignment = (
  width,
  height,
  columnWidth,
  rowHeight,
  index,
  align,
  scrollOffset,
  virtualizationParams,
  scrollbarSize
) =>
  getOffsetForIndexAndAlignment(
    "column",
    width,
    height,
    columnWidth,
    rowHeight,
    index,
    align,
    scrollOffset,
    virtualizationParams,
    scrollbarSize
  );

export const getOffsetForRowAndAlignment = (
  width,
  height,
  columnWidth,
  rowHeight,
  index,
  align,
  scrollOffset,
  virtualizationParams,
  scrollbarSize
) =>
  getOffsetForIndexAndAlignment(
    "row",
    width,
    height,
    columnWidth,
    rowHeight,
    index,
    align,
    scrollOffset,
    virtualizationParams,
    scrollbarSize
  );

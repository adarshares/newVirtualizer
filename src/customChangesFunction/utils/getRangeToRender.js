import {
  getColumnStartIndexForOffset,
  getColumnStopIndexForStartIndex,
  getRowStartIndexForOffset,
  getRowStopIndexForStartIndex,
} from "./getIndicesToRender";

export const getHorizontalRangeToRender = ({
  columnCount,
  overscanColumnCount,
  overscanCount,
  rowCount,
  columnWidth,
  rowHeight,
  width,
  virtualizationParams,
  scrollLeft,
  isScrolling,
  horizontalScrollDirection,
}) => {
  const overscanCountResolved = overscanColumnCount || overscanCount || 1;

  if (columnCount === 0 || rowCount === 0) {
    return [0, 0, 0, 0]; //make constant
  }

  const startIndex = getColumnStartIndexForOffset({
    columnWidth,
    rowHeight,
    columnCount,
    rowCount,
    scrollLeft,
    virtualizationParams: virtualizationParams.current,
  });

  const stopIndex = getColumnStopIndexForStartIndex({
    columnCount,
    width,
    columnWidth,
    rowHeight,
    startIndex,
    scrollLeft,
    virtualizationParams: virtualizationParams.current,
  });

  // Overscan by one item in each direction so that tab/focus works.
  // If there isn't at least one extra item, tab loops back around.
  const overscanBackward =
    !isScrolling || horizontalScrollDirection === "backward"
      ? Math.max(1, overscanCountResolved)
      : 1;
  const overscanForward =
    !isScrolling || horizontalScrollDirection === "forward"
      ? Math.max(1, overscanCountResolved)
      : 1;

  return [
    Math.max(0, startIndex - overscanBackward),
    Math.max(0, Math.min(columnCount - 1, stopIndex + overscanForward)),
    startIndex,
    stopIndex,
  ];
};

export const getVerticalRangeToRender = ({
  columnCount,
  overscanCount,
  overscanRowCount,
  rowCount,
  verticalScrollDirection,
  columnWidth,
  rowHeight,
  height,
  virtualizationParams,
  scrollTop,
}) => {
  const overscanCountResolved = overscanRowCount || overscanCount || 1;

  if (columnCount === 0 || rowCount === 0) {
    return [0, 0, 0, 0];
  }

  const startIndex = getRowStartIndexForOffset({
    columnWidth,
    rowHeight,
    columnCount,
    rowCount,
    scrollTop,
    virtualizationParams: virtualizationParams.current,
  });
  const stopIndex = getRowStopIndexForStartIndex(
    rowCount,
    height,
    columnWidth,
    rowHeight,
    startIndex,
    scrollTop,
    virtualizationParams.current
  );

  // Extra overscan atleast 1 for edge case
  const overscanBackward =
    true || verticalScrollDirection === "backward"
      ? Math.max(1, overscanCountResolved)
      : 1;
  const overscanForward =
    true || verticalScrollDirection === "forward"
      ? Math.max(1, overscanCountResolved)
      : 1;

  return [
    Math.max(0, startIndex - overscanBackward),
    Math.max(0, Math.min(rowCount - 1, stopIndex + overscanForward)),
    startIndex,
    stopIndex,
  ];
};

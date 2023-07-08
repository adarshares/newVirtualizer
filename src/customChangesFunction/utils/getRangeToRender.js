import {
  getColumnStartIndexForOffset,
  getColumnStopIndexForStartIndex,
  getRowStartIndexForOffset,
  getRowStopIndexForStartIndex,
} from "./getIndicesToRender";

export const getHorizontalRangeToRender = ({
  columnCount,
  overscanColumnCount,
  overscanColumnsCount,
  overscanCount,
  rowCount,
  columnWidth,
  rowHeight,
  width,
  instanceProps,
  scrollLeft,
  isScrolling,
  horizontalScrollDirection,
}) => {
  const overscanCountResolved =
    overscanColumnCount || overscanColumnsCount || overscanCount || 1;

  if (columnCount === 0 || rowCount === 0) {
    return [0, 0, 0, 0]; //make constant
  }

  const startIndex = getColumnStartIndexForOffset({
    columnWidth,
    rowHeight,
    columnCount,
    rowCount,
    scrollLeft,
    instanceProps: instanceProps.current,
  });

  const stopIndex = getColumnStopIndexForStartIndex({
    columnCount,
    width,
    columnWidth,
    rowHeight,
    startIndex,
    scrollLeft,
    instanceProps: instanceProps.current,
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
  overscanRowsCount,
  rowCount,
  verticalScrollDirection,
  columnWidth,
  rowHeight,
  height,
  instanceProps,
  scrollTop,
}) => {
  const overscanCountResolved =
    overscanRowCount || overscanRowsCount || overscanCount || 1;

  if (columnCount === 0 || rowCount === 0) {
    return [0, 0, 0, 0];
  }

  const startIndex = getRowStartIndexForOffset({
    columnWidth,
    rowHeight,
    columnCount,
    rowCount,
    scrollTop,
    instanceProps: instanceProps.current,
  });
  const stopIndex = getRowStopIndexForStartIndex(
    rowCount,
    height,
    columnWidth,
    rowHeight,
    startIndex,
    scrollTop,
    instanceProps.current
  );

  // Overscan by one item in each direction so that tab/focus works.
  // If there isn't at least one extra item, tab loops back around.
  const overscanBackward =
    true || verticalScrollDirection === "backward"
      ? Math.max(1, overscanCountResolved)
      : 1;
  const overscanForward =
    true || verticalScrollDirection === "forward"
      ? Math.max(1, overscanCountResolved)
      : 1;

  //console.log("overscans", overscanBackward, overscanForward);

  return [
    Math.max(0, startIndex - overscanBackward),
    Math.max(0, Math.min(rowCount - 1, stopIndex + overscanForward)),
    startIndex,
    stopIndex,
  ];
};

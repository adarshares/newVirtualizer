import {
  getColumnStartIndexForOffset,
  getColumnStopIndexForStartIndex,
  getRowStartIndexForOffset,
  getRowStopIndexForStartIndex,
} from "./getIndicesToRender";

export const _getHorizontalRangeToRender = (
  props,
  instanceProps,
  scrollLeft,
  isScrolling,
  horizontalScrollDirection
) => {
  const {
    columnCount,
    overscanColumnCount,
    overscanColumnsCount,
    overscanCount,
    rowCount,
  } = props;

  const overscanCountResolved =
    overscanColumnCount || overscanColumnsCount || overscanCount || 1;

  if (columnCount === 0 || rowCount === 0) {
    return [0, 0, 0, 0]; //make constant
  }

  const startIndex = getColumnStartIndexForOffset(
    props,
    scrollLeft,
    instanceProps.current
  );
  const stopIndex = getColumnStopIndexForStartIndex(
    props,
    startIndex,
    scrollLeft,
    instanceProps.current
  );

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

export const _getVerticalRangeToRender = (props, instanceProps, scrollTop) => {
  const {
    columnCount,
    overscanCount,
    overscanRowCount,
    overscanRowsCount,
    rowCount,
  } = props;

  const overscanCountResolved =
    overscanRowCount || overscanRowsCount || overscanCount || 1;

  if (columnCount === 0 || rowCount === 0) {
    return [0, 0, 0, 0];
  }

  const startIndex = getRowStartIndexForOffset(
    props,
    scrollTop,
    instanceProps.current
  );
  const stopIndex = getRowStopIndexForStartIndex(
    props,
    startIndex,
    scrollTop,
    instanceProps.current
  );

  // Overscan by one item in each direction so that tab/focus works.
  // If there isn't at least one extra item, tab loops back around.
  const overscanBackward =
    true || props.verticalScrollDirection === "backward"
      ? Math.max(1, overscanCountResolved)
      : 1;
  const overscanForward =
    true || props.verticalScrollDirection === "forward"
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

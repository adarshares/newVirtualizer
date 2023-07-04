const estimatedTotalSize = (
  columnCount,
  lastMeasuredColumnIndex,
  columnMetadataMap
) => {
  const unmeasuredCells = columnCount - lastMeasuredColumnIndex - 1;
  const unmeasuredColumnHeight = unmeasuredCells * 50;
  const lastCellMetaData =
    lastMeasuredColumnIndex >= 0
      ? columnMetadataMap.get(lastMeasuredColumnIndex)
      : undefined;
  const measuredColumnHeight = lastCellMetaData
    ? lastCellMetaData[offset] + lastCellMetaData[columnHeight]
    : 0;

  return unmeasuredColumnHeight + measuredColumnHeight;
};

const estimatedTotalSize = (rowCount, lastMeasuredRowIndex, rowMetadataMap) => {
  const unmeasuredCells = rowCount - lastMeasuredRowIndex - 1;
  const unmeasuredRowHeight = unmeasuredCells * 50;
  const lastCellMetaData =
    lastMeasuredRowIndex >= 0
      ? rowMetadataMap.get(lastMeasuredRowIndex)
      : undefined;
  const measuredRowHeight = lastCellMetaData
    ? lastCellMetaData[offset] + lastCellMetaData[rowHeight]
    : 0;

  return unmeasuredRowHeight + measuredRowHeight;
};

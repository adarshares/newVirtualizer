//cjhange the name dom recylcling
import { getItemMetadata } from "./metaDataManager";

import { getEstimatedTotalWidth } from "./getEstimatedTotalSize";

const getRowOffset = (columnWidth, rowHeight, index, virtualizationParams) =>
  getItemMetadata({
    itemType: "row",
    columnWidth,
    rowHeight,
    index,
    virtualizationParams,
  }).offset;

const getRowHeight = (index, virtualizationParams) =>
  virtualizationParams.rowMetadataMap[index].size;

const getColumnWidth = (index, virtualizationParams) =>
  virtualizationParams.columnMetadataMap[index].size;

const getColumnOffset = (columnWidth, rowHeight, index, virtualizationParams) =>
  getItemMetadata({
    itemType: "column",
    columnWidth,
    rowHeight,
    index,
    virtualizationParams,
  }).offset;

// Create Cache only while scrolling this will prevent rerenders while scrolling
// rowstyle and (cellstyle , cell ) caches will clear at different times so blocking times while clearring will spread

export const getCell = (
  rowIndex,
  columnIndex,
  isScrolling,
  cellCache,
  cellStyleCache,
  virtualizationParams,
  direction,
  columnWidth,
  rowHeight,
  CellRenderer //children
) => {
  const key = `${rowIndex}:${columnIndex}`;
  if (!cellCache.current.has(key) || !isScrolling) {
    const cellStyle = getCellStyle(
      rowIndex,
      columnIndex,
      isScrolling,
      direction,
      columnWidth,
      rowHeight,
      virtualizationParams,
      cellStyleCache
    );
    const Cell = (
      <CellRenderer
        columnIndex={columnIndex}
        rowIndex={rowIndex}
        key={key}
        style={cellStyle}
      />
    );

    if (!isScrolling) {
      return Cell;
    }
    cellCache.current.set(`${rowIndex}:${columnIndex}`, Cell);
  }
  return cellCache.current.get(`${rowIndex}:${columnIndex}`);
};
export const getCellStyle = (
  rowIndex,
  columnIndex,
  isScrolling,
  direction,
  columnWidth,
  rowHeight,
  virtualizationParams,
  cellStyleCache
) => {
  const key = `${rowIndex}:${columnIndex}`;
  if (!cellStyleCache.current.has(key) || !isScrolling) {
    const offset = getColumnOffset(
      columnWidth,
      rowHeight,
      columnIndex,
      virtualizationParams.current
    );
    const isRtl = direction === "rtl";
    const cellStyle = {
      position: "absolute",
      left: isRtl ? undefined : offset,
      right: isRtl ? offset : undefined,
      height: "100%",
      width: getColumnWidth(columnIndex, virtualizationParams.current),
    };
    if (!isScrolling) {
      return cellStyle;
    }
    cellStyleCache.current.set(key, cellStyle);
  }
  return cellStyleCache.current.get(key);
};
export const getRowStyle = ({
  rowIndex,
  rowStyleCache,
  isScrolling,
  virtualizationParams,
  columnWidth,
  rowHeight,
  columnCount,
}) => {
  const key = `${rowIndex}`;
  if (!rowStyleCache.current.has(key) || !isScrolling) {
    const rowStyle = {
      position: "absolute",
      top: getRowOffset(
        columnWidth,
        rowHeight,
        rowIndex,
        virtualizationParams.current
      ),
      height: getRowHeight(rowIndex, virtualizationParams.current),
      width: getEstimatedTotalWidth(
        { columnCount },
        virtualizationParams.current
      ),
    };
    if (!isScrolling) {
      return rowStyle;
    }
    rowStyleCache.current.set(key, rowStyle);
  }
  return rowStyleCache.current.get(key);
};
// transform can be used instead of assigning top position
// transform: `translateY(${getRowOffset(
//   this.props,
//   rowIndex,
//   this.virtualizationParams.current
// )}px)`,

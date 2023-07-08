import { createElement } from "react";
import { getItemMetadata } from "./metaDataManager";

import { getEstimatedTotalWidth } from "./getEstimatedTotalSize";

const getRowOffset = (columnWidth, rowHeight, index, instanceProps) =>
  getItemMetadata({
    itemType: "row",
    columnWidth,
    rowHeight,
    index,
    instanceProps,
  }).offset;

const getRowHeight = (index, instanceProps) =>
  instanceProps.rowMetadataMap[index].size;

const getColumnWidth = (index, instanceProps) =>
  instanceProps.columnMetadataMap[index].size;

const getColumnOffset = (columnWidth, rowHeight, index, instanceProps) =>
  getItemMetadata({
    itemType: "column",
    columnWidth,
    rowHeight,
    index,
    instanceProps,
  }).offset;

// Lazily create and cache item styles while scrolling,
// So that pure component sCU will prevent re-renders.
// We maintain this cache, and pass a style prop rather than index,
// So that List can clear cached styles and force item re-render if necessary.

export const getCell = (
  rowIndex,
  columnIndex,
  isScrolling,
  cellCache,
  cellStyleCache,
  instanceProps,
  direction,
  columnWidth,
  rowHeight,
  cellRenderer //children
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
      instanceProps,
      cellStyleCache
    );
    const cell = createElement(cellRenderer, {
      columnIndex,
      rowIndex,
      key,
      style: cellStyle,
    });
    if (!isScrolling) {
      return cell;
    }
    cellCache.current.set(`${rowIndex}:${columnIndex}`, cell);
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
  instanceProps,
  cellStyleCache
) => {
  const key = `${rowIndex}:${columnIndex}`;
  if (!cellStyleCache.current.has(key) || !isScrolling) {
    const offset = getColumnOffset(
      columnWidth,
      rowHeight,
      columnIndex,
      instanceProps.current
    );
    const isRtl = direction === "rtl";
    const cellStyle = {
      position: "absolute",
      left: isRtl ? undefined : offset,
      right: isRtl ? offset : undefined,
      height: "100%",
      width: getColumnWidth(columnIndex, instanceProps.current),
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
  instanceProps,
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
        instanceProps.current
      ),
      height: getRowHeight(rowIndex, instanceProps.current),
      width: getEstimatedTotalWidth({ columnCount }, instanceProps.current),
    };
    if (!isScrolling) {
      return rowStyle;
    }
    rowStyleCache.current.set(key, rowStyle);
  }
  return rowStyleCache.current.get(key);
};
// transform: `translateY(${getRowOffset(
//   this.props,
//   rowIndex,
//   this.instanceProps.current
// )}px)`,

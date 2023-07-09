import { createElement } from "react";
import { getItemMetadata } from "./metaDataManager";

import { getEstimatedTotalWidth } from "./getEstimatedTotalSize";

const getRowOffset = (props, index, instanceProps) =>
  getItemMetadata("row", props, index, instanceProps).offset;

const getRowHeight = (index, instanceProps) => {
  console.log(instanceProps);
  return 50;
  //instanceProps.rowMetadataMap[index]?.size;
};

const getColumnWidth = (index, instanceProps) => {
  console.log(instanceProps);
  return 50;
  //instanceProps.columnMetadataMap[index]?.size;
};

const getColumnOffset = (props, index, instanceProps) =>
  getItemMetadata("column", props, index, instanceProps).offset;

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
  props
) => {
  const key = `${rowIndex}:${columnIndex}`;
  if (!cellCache.current.has(key) || !isScrolling) {
    const cellRenderer = props.children;
    const cellStyle = getCellStyle(
      rowIndex,
      columnIndex,
      isScrolling,
      props,
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

// const { getCellStyle } = useCacheManager({
//   props,
//   instanceProps,
//   cellStyleCache,
// });

export const getCellStyle = (
  rowIndex,
  columnIndex,
  isScrolling,
  props,
  instanceProps,
  cellStyleCache
) => {
  const key = `${rowIndex}:${columnIndex}`;
  if (!cellStyleCache.current.has(key) || !isScrolling) {
    const { direction } = props;
    const offset = getColumnOffset(props, columnIndex, instanceProps.current);
    const isRtl = direction === "rtl";
    const cellStyle = {
      position: "absolute",
      left: isRtl ? undefined : offset,
      right: isRtl ? offset : undefined,
      height: "100%",
      width: getColumnWidth(props, columnIndex, instanceProps.current),
    };
    if (!isScrolling) {
      return cellStyle;
    }
    cellStyleCache.current.set(key, cellStyle);
  }
  return cellStyleCache.current.get(key);
};
export const getRowStyle = (
  rowIndex,
  rowStyleCache,
  isScrolling,
  instanceProps,
  props
) => {
  const key = `${rowIndex}`;
  if (!rowStyleCache.current.has(key) || !isScrolling) {
    const rowStyle = {
      position: "absolute",
      top: getRowOffset(props, rowIndex, instanceProps.current),
      height: getRowHeight(props, rowIndex, instanceProps.current),
      width: getEstimatedTotalWidth(props, instanceProps.current),
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

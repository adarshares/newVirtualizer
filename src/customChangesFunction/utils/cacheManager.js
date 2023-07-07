import { createElement } from "react";
import { getItemMetadata } from "./metaDataManager";

import { getEstimatedTotalWidth } from "./getEstimatedTotalSize";

const getRowOffset = (props, index, instanceProps) =>
  getItemMetadata("row", props, index, instanceProps).offset;

const getRowHeight = (props, index, instanceProps) =>
  instanceProps.rowMetadataMap[index]?.size;

const getColumnWidth = (props, index, instanceProps) =>
  instanceProps.columnMetadataMap[index].size;

const getColumnOffset = (props, index, instanceProps) =>
  getItemMetadata("column", props, index, instanceProps).offset;

// Lazily create and cache item styles while scrolling,
// So that pure component sCU will prevent re-renders.
// We maintain this cache, and pass a style prop rather than index,
// So that List can clear cached styles and force item re-render if necessary.

export const _getCell = (
  rowIndex,
  columnIndex,
  isScrolling,
  _cellCache,
  _cellStyleCache,
  _instanceProps,
  props
) => {
  const key = `${rowIndex}:${columnIndex}`;
  if (!_cellCache.current.has(key) || !isScrolling) {
    const cellRenderer = props.children;
    const cellStyle = _getCellStyle(
      rowIndex,
      columnIndex,
      isScrolling,
      props,
      _instanceProps,
      _cellStyleCache
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
    _cellCache.current.set(`${rowIndex}:${columnIndex}`, cell);
  }
  return _cellCache.current.get(`${rowIndex}:${columnIndex}`);
};
export const _getCellStyle = (
  rowIndex,
  columnIndex,
  isScrolling,
  props,
  _instanceProps,
  _cellStyleCache
) => {
  const key = `${rowIndex}:${columnIndex}`;
  if (!_cellStyleCache.current.has(key) || !isScrolling) {
    const { direction } = props;
    const offset = getColumnOffset(props, columnIndex, _instanceProps.current);
    const isRtl = direction === "rtl";
    const cellStyle = {
      position: "absolute",
      left: isRtl ? undefined : offset,
      right: isRtl ? offset : undefined,
      height: getRowHeight(props, rowIndex, _instanceProps.current),
      width: getColumnWidth(props, columnIndex, _instanceProps.current),
    };
    if (!isScrolling) {
      return cellStyle;
    }
    _cellStyleCache.current.set(key, cellStyle);
  }
  return _cellStyleCache.current.get(key);
};
export const _getRowStyle = (
  rowIndex,
  _rowStyleCache,
  isScrolling,
  _instanceProps,
  props
) => {
  const key = `${rowIndex}`;
  if (!_rowStyleCache.current.has(key) || !isScrolling) {
    const rowStyle = {
      position: "absolute",
      top: getRowOffset(props, rowIndex, _instanceProps.current),
      height: getRowHeight(props, rowIndex, _instanceProps.current),
      width: getEstimatedTotalWidth(props, _instanceProps.current),
    };
    if (!isScrolling) {
      return rowStyle;
    }
    _rowStyleCache.current.set(key, rowStyle);
  }
  return _rowStyleCache.current.get(key);
};
// transform: `translateY(${getRowOffset(
//   this.props,
//   rowIndex,
//   this._instanceProps.current
// )}px)`,

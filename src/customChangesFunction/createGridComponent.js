// @flow

import memoizeOne from "memoize-one";
import {
  createElement,
  forwardRef,
  memo,
  useEffect,
  useRef,
  useState,
} from "react";
import { cancelTimeout, requestTimeout } from "./timer";
import { getScrollbarSize, getRTLOffsetType } from "./domHelpers";

const IS_SCROLLING_DEBOUNCE_INTERVAL = 150;

const defaultItemKey = ({ columnIndex, data, rowIndex }) =>
  `${rowIndex}:${columnIndex}`;

// In DEV mode, this Set helps us only log a warning once per component instance.
// This avoids spamming the console every time a render happens.
let devWarningsOverscanCount = null;
let devWarningsOverscanRowsColumnsCount = null;
let devWarningsTagName = null;
if (process.env.NODE_ENV !== "production") {
  if (typeof window !== "undefined" && typeof window.WeakSet !== "undefined") {
    devWarningsOverscanCount = new WeakSet();
    devWarningsOverscanRowsColumnsCount = new WeakSet();
    devWarningsTagName = new WeakSet();
  }
}

export default function createGridComponent({
  getColumnOffset,
  getColumnStartIndexForOffset,
  getColumnStopIndexForStartIndex,
  getColumnWidth,
  getEstimatedTotalHeight,
  getEstimatedTotalWidth,
  getOffsetForColumnAndAlignment,
  getOffsetForRowAndAlignment,
  getRowHeight,
  getRowOffset,
  getRowStartIndexForOffset,
  getRowStopIndexForStartIndex,
  initInstanceProps,
  shouldResetStyleCacheOnItemSizeChange,
  validateProps,
}) {
  return memo(
    forwardRef((props, _outerRef) => {
      const [isScrolling, setIsScrolling] = useState(false);
      const [horizontalScrollDirection, setHorizontalScrollDirection] =
        useState("forward");
      const [scrollLeft, setScrollLeft] = useState(
        typeof initialScrollLeft === "number" ? props.initialScrollLeft : 0
      );
      const [scrollTop, setScrollTop] = useState(
        typeof initialScrollTop === "number" ? props.initialScrollTop : 0
      );
      const [scrollUpdateWasRequested, setScrollUpdateWasRequested] =
        useState(false);

      //const _outerRef = useRef(null);
      const _cellCache = useRef(new Map());
      const _cellStyleCache = useRef(new Map());
      const _rowStyleCache = useRef(new Map());
      const _resetIsScrollingTimeoutId = useRef(null);
      const _instanceProps = useRef(initInstanceProps(props));

      const scrollTo = ({ scrollLeft, scrollTop }) => {
        console.log("scrollTo me aaya", scrollLeft, scrollTop);
        if (scrollLeft !== undefined) {
          scrollLeft = Math.max(0, scrollLeft);
        }
        if (scrollTop !== undefined) {
          scrollTop = Math.max(0, scrollTop);
        }

        setScrollUpdateWasRequested(true);
        setScrollLeft((prevState) =>
          scrollLeft === undefined ? prevState : scrollLeft
        );
        setScrollTop((prevState) =>
          scrollTop === undefined ? prevState : scrollTop
        );
        setIsScrolling(true);
        _resetIsScrollingDebounced();
      };

      const scrollToItem = ({ align = "auto", columnIndex, rowIndex }) => {
        const { columnCount, height, rowCount, width } = props;
        const scrollbarSize = getScrollbarSize();

        if (columnIndex !== undefined) {
          columnIndex = Math.max(0, Math.min(columnIndex, columnCount - 1));
        }
        if (rowIndex !== undefined) {
          rowIndex = Math.max(0, Math.min(rowIndex, rowCount - 1));
        }

        const estimatedTotalHeight = getEstimatedTotalHeight(
          props,
          _instanceProps.current
        );
        const estimatedTotalWidth = getEstimatedTotalWidth(
          props,
          _instanceProps.current
        );

        // The scrollbar size should be considered when scrolling an item into view,
        // to ensure it's fully visible.
        // But we only need to account for its size when it's actually visible.
        const horizontalScrollbarSize =
          estimatedTotalWidth > width ? scrollbarSize : 0;
        const verticalScrollbarSize =
          estimatedTotalHeight > height ? scrollbarSize : 0;

        scrollTo({
          scrollLeft:
            columnIndex !== undefined
              ? getOffsetForColumnAndAlignment(
                  props,
                  columnIndex,
                  align,
                  scrollLeft,
                  _instanceProps.current,
                  verticalScrollbarSize
                )
              : scrollLeft,
          scrollTop:
            rowIndex !== undefined
              ? getOffsetForRowAndAlignment(
                  props,
                  rowIndex,
                  align,
                  scrollTop,
                  _instanceProps.current,
                  horizontalScrollbarSize
                )
              : scrollTop,
        });
      };

      useEffect(() => {
        const { initialScrollLeft, initialScrollTop } = props;

        if (_outerRef.current != null) {
          const outerRef = _outerRef.current;
          if (typeof initialScrollLeft === "number") {
            outerRef.scrollLeft = initialScrollLeft;
          }
          if (typeof initialScrollTop === "number") {
            outerRef.scrollTop = initialScrollTop;
          }
        }

        _callPropsCallbacks();
        return () => {
          if (_resetIsScrollingTimeoutId.current !== null) {
            cancelTimeout(_resetIsScrollingTimeoutId.current);
          }
        };
      }, []);

      useEffect(() => {
        const outerRef = _outerRef.current;

        if (scrollUpdateWasRequested && outerRef != null) {
          if (props.direction === "rtl") {
            switch (getRTLOffsetType()) {
              case "negative":
                outerRef.scrollLeft = -scrollLeft;
                break;
              case "positive-ascending":
                outerRef.scrollLeft = scrollLeft;
                break;
              default:
                const { clientWidth, scrollWidth } = outerRef;
                outerRef.scrollLeft = scrollWidth - clientWidth - scrollLeft;
                break;
            }
          } else {
            outerRef.scrollLeft = Math.max(0, scrollLeft);
          }

          outerRef.scrollTop = Math.max(0, scrollTop);
        }

        _callPropsCallbacks();
      }, [scrollUpdateWasRequested, scrollLeft, scrollTop]);

      const _callOnItemsRendered = memoizeOne(
        (
          overscanColumnStartIndex,
          overscanColumnStopIndex,
          overscanRowStartIndex,
          overscanRowStopIndex,
          visibleColumnStartIndex,
          visibleColumnStopIndex,
          visibleRowStartIndex,
          visibleRowStopIndex
        ) =>
          props.onItemsRendered({
            rowStartIndex: overscanRowStartIndex,
            rowStopIndex: overscanColumnStartIndex,
            overscanColumnStartIndex,
            overscanColumnStopIndex,
            overscanRowStartIndex,
            overscanRowStopIndex,
            visibleColumnStartIndex,
            visibleColumnStopIndex,
            visibleRowStartIndex,
            visibleRowStopIndex,
          })
      );

      const _callPropsCallbacks = () => {
        const { columnCount, onItemsRendered, rowCount } = props;

        if (typeof onItemsRendered === "function") {
          if (columnCount > 0 && rowCount > 0) {
            const [
              overscanColumnStartIndex,
              overscanColumnStopIndex,
              visibleColumnStartIndex,
              visibleColumnStopIndex,
            ] = _getHorizontalRangeToRender();
            const [
              overscanRowStartIndex,
              overscanRowStopIndex,
              visibleRowStartIndex,
              visibleRowStopIndex,
            ] = _getVerticalRangeToRender();
            _callOnItemsRendered(
              overscanColumnStartIndex,
              overscanColumnStopIndex,
              overscanRowStartIndex,
              overscanRowStopIndex,
              visibleColumnStartIndex,
              visibleColumnStopIndex,
              visibleRowStartIndex,
              visibleRowStopIndex
            );
          }
        }
      };

      // Lazily create and cache item styles while scrolling,
      // So that pure component sCU will prevent re-renders.
      // We maintain this cache, and pass a style prop rather than index,
      // So that List can clear cached styles and force item re-render if necessary.
      const _getCell = (rowIndex, columnIndex, isScrolling) => {
        const key = `${rowIndex}:${columnIndex}`;
        if (!_cellCache.current.has(key) || !isScrolling) {
          const cellRenderer = props.children;
          const cellStyle = _getCellStyle(rowIndex, columnIndex, isScrolling);
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
      const _getCellStyle = (rowIndex, columnIndex, isScrolling) => {
        const key = `${rowIndex}:${columnIndex}`;
        if (!_cellStyleCache.current.has(key) || !isScrolling) {
          const { direction } = props;
          const offset = getColumnOffset(
            props,
            columnIndex,
            _instanceProps.current
          );
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
      const _getRowStyle = (rowIndex, isScrolling) => {
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

      const _getHorizontalRangeToRender = () => {
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
          return [0, 0, 0, 0];
        }

        const startIndex = getColumnStartIndexForOffset(
          props,
          scrollLeft,
          _instanceProps.current
        );
        const stopIndex = getColumnStopIndexForStartIndex(
          props,
          startIndex,
          scrollLeft,
          _instanceProps.current
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

      const _getVerticalRangeToRender = () => {
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
          _instanceProps.current
        );
        const stopIndex = getRowStopIndexForStartIndex(
          props,
          startIndex,
          scrollTop,
          _instanceProps.current
        );

        // Overscan by one item in each direction so that tab/focus works.
        // If there isn't at least one extra item, tab loops back around.
        const overscanBackward =
          !isScrolling || props.verticalScrollDirection === "backward"
            ? Math.max(1, overscanCountResolved)
            : 1;
        const overscanForward =
          !isScrolling || props.verticalScrollDirection === "forward"
            ? Math.max(1, overscanCountResolved)
            : 1;

        return [
          Math.max(0, startIndex - overscanBackward),
          Math.max(0, Math.min(rowCount - 1, stopIndex + overscanForward)),
          startIndex,
          stopIndex,
        ];
      };

      // const _outerRefSetter = (ref) => {
      //   const { outerRef } = props;

      //   _outerRef = ref;

      //   if (typeof outerRef === "function") {
      //     outerRef(ref);
      //   } else if (
      //     outerRef != null &&
      //     typeof outerRef === "object" &&
      //     outerRef.hasOwnProperty("current")
      //   ) {
      //     outerRef.current = ref;
      //   }
      // };

      const _resetIsScrollingDebounced = () => {
        if (_resetIsScrollingTimeoutId !== null) {
          cancelTimeout(_resetIsScrollingTimeoutId.current);
        }

        _resetIsScrollingTimeoutId = requestTimeout(
          _resetIsScrolling,
          IS_SCROLLING_DEBOUNCE_INTERVAL
        );
      };

      const _resetIsScrolling = () => {
        _resetIsScrollingTimeoutId = null;

        setIsScrolling(false);
        // Clear style cache after state update has been committed.
        // way we don't break pure sCU for items that don't use isScrolling param.
        if (_cellCache.current.size > 1000) {
          _cellCache.current.clear(); // = new Map(); //{};
        }
        if (_cellStyleCache.current.size > 1000) {
          _cellStyleCache.current.clear(); // = new Map(); //{};
        }
        if (_rowStyleCache.current.size > 1000) {
          _rowStyleCache.current.clear(); // = new Map(); //{};
        }
      };

      const [columnStartIndex, columnStopIndex] = _getHorizontalRangeToRender();
      const [rowStartIndex, rowStopIndex] = _getVerticalRangeToRender();

      const items = [];
      if (props.columnCount > 0 && props.rowCount) {
        for (
          let rowIndex = rowStartIndex;
          rowIndex <= rowStopIndex;
          rowIndex++
        ) {
          const rows = [];
          for (
            let columnIndex = columnStartIndex;
            columnIndex <= columnStopIndex;
            columnIndex++
          ) {
            rows.push(_getCell(rowIndex, columnIndex, isScrolling));
          }
          items.push(
            createElement("div", {
              children: rows,
              rowindex: rowIndex,
              key: `${rowIndex}`,
              style: _getRowStyle(rowIndex, isScrolling),
              role: "row",
              "aria-rowindex": `${rowIndex + 1}`,
            })
          );
        }
      }

      // Read this value AFTER items have been created,
      // So their actual sizes (if variable) are taken into consideration.
      const estimatedTotalHeight = getEstimatedTotalHeight(
        props,
        _instanceProps.current
      );
      const estimatedTotalWidth = getEstimatedTotalWidth(
        props,
        _instanceProps.current
      );

      //console.log("scrollTo", "createelement called");

      return createElement(
        props.outerElementType || props.outerTagName || "div",
        {
          className: props.className,
          ref: _outerRef,
          style: {
            position: "relative",
            height: props.width,
            width: props.width,
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
            willChange: "transform",
            direction: props.direction,
            ...props.style,
          },
          role: "presentation",
        },
        createElement(props.innerElementType || props.innerTagName || "div", {
          children: items,
          //ref: innerRef,
          style: {
            height: estimatedTotalHeight,
            pointerEvents: isScrolling ? "none" : undefined,
            width: estimatedTotalWidth,
          },
          role: "presentation",
        })
      );
    })
  );
}

const validateSharedProps = (
  {
    children,
    direction,
    height,
    innerTagName,
    outerTagName,
    overscanColumnsCount,
    overscanCount,
    overscanRowsCount,
    width,
  },
  { instance }
) => {
  if (process.env.NODE_ENV !== "production") {
    if (typeof overscanCount === "number") {
      if (devWarningsOverscanCount && !devWarningsOverscanCount.has(instance)) {
        devWarningsOverscanCount.add(instance);
        console.warn(
          "The overscanCount prop has been deprecated. " +
            "Please use the overscanColumnCount and overscanRowCount props instead."
        );
      }
    }

    if (
      typeof overscanColumnsCount === "number" ||
      typeof overscanRowsCount === "number"
    ) {
      if (
        devWarningsOverscanRowsColumnsCount &&
        !devWarningsOverscanRowsColumnsCount.has(instance)
      ) {
        devWarningsOverscanRowsColumnsCount.add(instance);
        console.warn(
          "The overscanColumnsCount and overscanRowsCount props have been deprecated. " +
            "Please use the overscanColumnCount and overscanRowCount props instead."
        );
      }
    }

    if (innerTagName != null || outerTagName != null) {
      if (devWarningsTagName && !devWarningsTagName.has(instance)) {
        devWarningsTagName.add(instance);
        console.warn(
          "The innerTagName and outerTagName props have been deprecated. " +
            "Please use the innerElementType and outerElementType props instead."
        );
      }
    }

    if (children == null) {
      throw Error(
        'An invalid "children" prop has been specified. ' +
          "Value should be a React component. " +
          `"${children === null ? "null" : typeof children}" was specified.`
      );
    }

    switch (direction) {
      case "ltr":
      case "rtl":
        // Valid values
        break;
      default:
        throw Error(
          'An invalid "direction" prop has been specified. ' +
            'Value should be either "ltr" or "rtl". ' +
            `"${direction}" was specified.`
        );
    }

    if (typeof width !== "number") {
      throw Error(
        'An invalid "width" prop has been specified. ' +
          "Grids must specify a number for width. " +
          `"${width === null ? "null" : typeof width}" was specified.`
      );
    }

    if (typeof height !== "number") {
      throw Error(
        'An invalid "height" prop has been specified. ' +
          "Grids must specify a number for height. " +
          `"${height === null ? "null" : typeof height}" was specified.`
      );
    }
  }
};

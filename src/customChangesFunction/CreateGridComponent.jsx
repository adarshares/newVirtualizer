// @flow

import memoizeOne from "memoize-one";
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { cancelTimeout, requestTimeout } from "./helpers/timer";
import { getScrollbarSize, getRTLOffsetType } from "./helpers/domHelpers";
import {
  _getVerticalRangeToRender,
  _getHorizontalRangeToRender,
} from "./utils/getRangeToRender";

import { _getCell, _getCellStyle, _getRowStyle } from "./utils/cacheManager";
import {
  getEstimatedTotalHeight,
  getEstimatedTotalWidth,
} from "./utils/getEstimatedTotalSize";

import { initInstanceProps } from "./utils/instancePropsInitialization";
import { getOffsetForIndexAndAlignment } from "./utils/metaDataManager";

const IS_SCROLLING_DEBOUNCE_INTERVAL = 150;

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

export default function CreateGridComponent() {
  const getOffsetForColumnAndAlignment = (
    props,
    index,
    align,
    scrollOffset,
    instanceProps,
    scrollbarSize
  ) =>
    getOffsetForIndexAndAlignment(
      "column",
      props,
      index,
      align,
      scrollOffset,
      instanceProps,
      scrollbarSize
    );

  const getOffsetForRowAndAlignment = (
    props,
    index,
    align,
    scrollOffset,
    instanceProps,
    scrollbarSize
  ) =>
    getOffsetForIndexAndAlignment(
      "row",
      props,
      index,
      align,
      scrollOffset,
      instanceProps,
      scrollbarSize
    );

  return memo(
    forwardRef((props, ref) => {
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

      const _cellCache = useRef(new Map());
      const _cellStyleCache = useRef(new Map());
      const _rowStyleCache = useRef(new Map());
      const _resetIsScrollingTimeoutId = useRef(null);
      const _instanceProps = useRef(initInstanceProps(props));
      const _outerRef = useRef(null);

      const scrollTo = ({ scrollLeft, scrollTop }) => {
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

        const scrollLeft =
          columnIndex !== undefined
            ? getOffsetForColumnAndAlignment(
                props,
                columnIndex,
                align,
                scrollLeft,
                _instanceProps.current,
                verticalScrollbarSize
              )
            : scrollLeft;
        const scrollTop =
          rowIndex !== undefined
            ? getOffsetForRowAndAlignment(
                props,
                rowIndex,
                align,
                scrollTop,
                _instanceProps.current,
                horizontalScrollbarSize
              )
            : scrollTop;
        scrollTo({ scrollLeft, scrollTop });
      };
      useImperativeHandle(ref, () => {
        return {
          scrollTo,
          scrollToItem,
        };
      });

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

        callPropsCallbacks();
        return () => {
          if (_resetIsScrollingTimeoutId.current) {
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

        callPropsCallbacks();
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

      const callPropsCallbacks = () => {
        const { columnCount, onItemsRendered, rowCount } = props;
        if (typeof onItemsRendered === "function") {
          if (columnCount > 0 && rowCount > 0) {
            const [
              overscanColumnStartIndex,
              overscanColumnStopIndex,
              visibleColumnStartIndex,
              visibleColumnStopIndex,
            ] = _getHorizontalRangeToRender(
              props,
              _instanceProps,
              scrollLeft,
              isScrolling,
              horizontalScrollDirection
            );
            const [
              overscanRowStartIndex,
              overscanRowStopIndex,
              visibleRowStartIndex,
              visibleRowStopIndex,
            ] = _getVerticalRangeToRender(props, _instanceProps, scrollTop);
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

      const outerRefSetter = useCallback((ref) => {
        _outerRef.current = ref;
      }, []);

      const _resetIsScrollingDebounced = () => {
        if (_resetIsScrollingTimeoutId.current) {
          cancelTimeout(_resetIsScrollingTimeoutId.current);
        }

        _resetIsScrollingTimeoutId.current = requestTimeout(
          _resetIsScrolling,
          IS_SCROLLING_DEBOUNCE_INTERVAL
        );
      };

      const _resetIsScrolling = () => {
        _resetIsScrollingTimeoutId.current = null;

        setIsScrolling(false);
        // Clear style cache after state update has been committed and the size of cache has exceeded its max value.
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

      const [columnStartIndex, columnStopIndex] = _getHorizontalRangeToRender(
        props,
        _instanceProps,
        scrollLeft,
        isScrolling,
        horizontalScrollDirection
      );
      const [rowStartIndex, rowStopIndex] = _getVerticalRangeToRender(
        props,
        _instanceProps,
        scrollTop
      );

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
            rows.push(
              _getCell(
                rowIndex,
                columnIndex,
                isScrolling,
                _cellCache,
                _cellStyleCache,
                _instanceProps,
                props
              )
            );
          }
          items.push(
            <div
              children={rows}
              rowindex={rowIndex}
              key={`${rowIndex}`}
              style={_getRowStyle(
                rowIndex,
                _rowStyleCache,
                isScrolling,
                _instanceProps,
                props
              )}
              role="row"
              aria-rowindex={`${rowIndex + 1}`}
            />
          );
        }
      }

      const estimatedTotalHeight = getEstimatedTotalHeight(
        props,
        _instanceProps.current
      );
      const estimatedTotalWidth = getEstimatedTotalWidth(
        props,
        _instanceProps.current
      );

      return (
        <div
          ref={outerRefSetter}
          style={{
            position: "relative",
            height: props.width,
            width: props.width,
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
            willChange: "transform",
            direction: props.direction,
            ...props.style,
          }}
          role="presentation"
        >
          <div
            style={{
              height: estimatedTotalHeight,
              pointerEvents: isScrolling ? "none" : undefined,
              width: estimatedTotalWidth,
            }}
            role="presentation"
          >
            {items}
          </div>
        </div>
      );
    })
  );
}

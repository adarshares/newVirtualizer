import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { cancelTimeout, requestTimeout } from "./helpers/timer";
import { getRTLOffsetType } from "./helpers/domHelpers";
import {
  getVerticalRangeToRender,
  getHorizontalRangeToRender,
} from "./utils/getRangeToRender";
import { getCell, getRowStyle } from "./utils/cacheManager";
import {
  getEstimatedTotalHeight,
  getEstimatedTotalWidth,
} from "./utils/getEstimatedTotalSize";
import { initInstanceProps } from "./utils/instancePropsInitialization";
// import {
//   getOffsetForColumnAndAlignment,
//   getOffsetForRowAndAlignment,
// } from "./utils/metaDataManager";
import { useScroll } from "./hooks/useScroll";
import { ACTION_TYPES } from "./hooks/action_types";
import { useCache } from "./hooks/useCache";

const IS_SCROLLING_DEBOUNCE_INTERVAL = 150;

const VariableSizeGrid = memo(
  forwardRef((props, ref) => {
    const {
      initialScrollLeft,
      initialScrollTop,
      columnCount,
      height,
      rowCount,
      width,
      columnWidth,
      rowHeight,
      direction,
      onItemsRendered,
      overscanColumnCount,
      overscanRowCount,
      overscanCount,
      verticalScrollDirection,
      //children
      //style
    } = props;

    const latestPropsRef = useLatest(props);

    const {
      isScrolling,
      horizontalScrollDirection,
      scrollLeft,
      scrollTop,
      scrollUpdateWasRequested,
      onAction,
    } = useScroll({
      initialScrollLeft,
      initialScrollTop,
    });

    const { getCache, setCache } = useCache();
    const resetIsScrollingTimeoutId = useRef(null);
    const virtualizationParams = useRef(initInstanceProps(props));

    const outerRef = useRef(null);

    const resetIsScrolling = useCallback(() => {
      resetIsScrollingTimeoutId.current = null;

      onAction({ type: ACTION_TYPES.SCROLL_STOP });
      // Clear style cache after state update has been committed and the size of cache has exceeded its max value.
      setCache({ type: ACTION_TYPES.CLEAR_CACHE });
    }, [onAction, setCache]);

    const resetIsScrollingDebounced = useCallback(() => {
      if (resetIsScrollingTimeoutId.current) {
        cancelTimeout(resetIsScrollingTimeoutId.current);
      }

      resetIsScrollingTimeoutId.current = requestTimeout(
        resetIsScrolling,
        IS_SCROLLING_DEBOUNCE_INTERVAL
      );
    }, [resetIsScrolling]);

    const scrollTo = useCallback(
      ({ scrollLeft, scrollTop }) => {
        if (scrollLeft !== undefined) {
          scrollLeft = Math.max(0, scrollLeft);
        }
        if (scrollTop !== undefined) {
          scrollTop = Math.max(0, scrollTop);
        }

        onAction({ type: ACTION_TYPES.SCROLL_START });
        resetIsScrollingDebounced();
      },
      [onAction, resetIsScrollingDebounced]
    );

    useImperativeHandle(ref, () => {
      return {
        scrollTo,
        //scrollToItem,
      };
    });

    const callOnItemsRendered = useCallback(
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
        onItemsRendered({
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
        }),
      [latestPropsRef]
    );
    const callPropsCallbacks = useCallback(() => {
      const {
        columnCount,
        columnWidth,
        height,
        horizontalScrollDirection,
        isScrolling,
        onItemsRendered,
        overscanColumnCount,
        overscanCount,
        overscanRowCount,
        rowCount,
        rowHeight,
        scrollLeft,
        scrollTop,
        verticalScrollDirection,
        width,
      } = latestPropsRef.current;

      if (typeof onItemsRendered === "function") {
        if (columnCount > 0 && rowCount > 0) {
          const [
            overscanColumnStartIndex,
            overscanColumnStopIndex,
            visibleColumnStartIndex,
            visibleColumnStopIndex,
          ] = getHorizontalRangeToRender({
            columnCount,
            overscanColumnCount,
            overscanCount,
            rowCount,
            columnWidth,
            rowHeight,
            width,
            virtualizationParams,
            scrollLeft,
            isScrolling,
            horizontalScrollDirection,
          });
          const [
            overscanRowStartIndex,
            overscanRowStopIndex,
            visibleRowStartIndex,
            visibleRowStopIndex,
          ] = getVerticalRangeToRender({
            columnCount,
            overscanCount,
            overscanRowCount,
            rowCount,
            verticalScrollDirection,
            columnWidth,
            rowHeight,
            height,
            virtualizationParams,
            scrollTop,
          });
          callOnItemsRendered(
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
    }, [callOnItemsRendered, latestPropsRef]);

    useEffect(() => {
      if (outerRef.current != null) {
        const outerRefCurrent = outerRef.current;
        if (typeof initialScrollLeft === "number") {
          outerRefCurrent.scrollLeft = initialScrollLeft;
        }
        if (typeof initialScrollTop === "number") {
          outerRefCurrent.scrollTop = initialScrollTop;
        }
      }

      callPropsCallbacks();
      return () => {
        if (resetIsScrollingTimeoutId.current) {
          cancelTimeout(resetIsScrollingTimeoutId.current);
        }
      };
    }, []);

    useEffect(() => {
      const outerRefCurrent = outerRef.current;

      if (scrollUpdateWasRequested && outerRefCurrent != null) {
        if (direction === "rtl") {
          switch (getRTLOffsetType()) {
            case "negative":
              outerRefCurrent.scrollLeft = -scrollLeft;
              break;
            case "positive-ascending":
              outerRefCurrent.scrollLeft = scrollLeft;
              break;
            default:
              const { clientWidth, scrollWidth } = outerRefCurrent;
              outerRefCurrent.scrollLeft =
                scrollWidth - clientWidth - scrollLeft;
              break;
          }
        } else {
          outerRefCurrent.scrollLeft = Math.max(0, scrollLeft);
        }

        outerRefCurrent.scrollTop = Math.max(0, scrollTop);
      }

      callPropsCallbacks();
    }, [
      scrollUpdateWasRequested,
      scrollLeft,
      scrollTop,
      callPropsCallbacks,
      direction,
    ]);

    const [columnStartIndex, columnStopIndex] = getHorizontalRangeToRender({
      columnCount,
      overscanColumnCount,
      overscanCount,
      rowCount,
      columnWidth,
      rowHeight,
      width,
      virtualizationParams,
      scrollLeft,
      isScrolling,
      horizontalScrollDirection,
    });
    const [rowStartIndex, rowStopIndex] = getVerticalRangeToRender({
      columnCount,
      overscanCount,
      overscanRowCount,
      rowCount,
      verticalScrollDirection,
      columnWidth,
      rowHeight,
      height,
      virtualizationParams,
      scrollTop,
    });

    const items = [];
    if (columnCount > 0 && rowCount) {
      for (let rowIndex = rowStartIndex; rowIndex <= rowStopIndex; rowIndex++) {
        const rows = [];
        for (
          let columnIndex = columnStartIndex;
          columnIndex <= columnStopIndex;
          columnIndex++
        ) {
          rows.push(
            getCell(
              rowIndex,
              columnIndex,
              isScrolling,
              getCache({ type: ACTION_TYPES.GET_CELL }),
              getCache({ type: ACTION_TYPES.GET_CELL_STYLE }),
              virtualizationParams,
              direction,
              columnWidth,
              rowHeight,
              props.children
            )
          );
        }
        items.push(
          <div
            children={rows}
            rowindex={rowIndex}
            key={`${rowIndex}`}
            style={getRowStyle({
              rowIndex,
              rowStyleCache: getCache({
                type: ACTION_TYPES.GET_ROW_STYLE,
                rowIndex,
              }),
              isScrolling,
              virtualizationParams,
              columnWidth,
              rowHeight,
              columnCount,
            })}
            role="row"
            aria-rowindex={rowIndex + 1}
          />
        );
      }
    }

    const estimatedTotalHeight = getEstimatedTotalHeight(
      { rowCount },
      virtualizationParams.current
    );
    const estimatedTotalWidth = getEstimatedTotalWidth(
      { columnCount },
      virtualizationParams.current
    );

    return (
      <div
        ref={outerRef.current}
        style={{
          position: "relative",
          height: height,
          width: width,
          overflow: "auto",
          WebkitOverflowScrolling: "touch",
          willChange: "transform",
          direction,
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

export default VariableSizeGrid;
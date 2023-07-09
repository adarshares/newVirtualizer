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
  getVerticalRangeToRender,
  getHorizontalRangeToRender,
} from "./utils/getRangeToRender";

import { getCell, getRowStyle } from "./utils/cacheManager";
import {
  getEstimatedTotalHeight,
  getEstimatedTotalWidth,
} from "./utils/getEstimatedTotalSize";

import { initInstanceProps } from "./utils/instancePropsInitialization";
import {
  getOffsetForColumnAndAlignment,
  getOffsetForRowAndAlignment,
} from "./utils/metaDataManager";

const IS_SCROLLING_DEBOUNCE_INTERVAL = 150;

const VariableSizeGrid = memo(
  forwardRef((props, ref) => {
    //const {} = props; // using destructering

    //  Wrap this state in a hook,
    // hook will return
    //{ isScrolling, horizontalScrollDirection, scrollLeft, scrollTop, onAction} = useVirtualScrolling()
    const [isScrolling, setIsScrolling] = useState(false);
    const [horizontalScrollDirection, setHorizontalScrollDirection] =
      useState("forward"); // convert into enum
    const [scrollLeft, setScrollLeft] = useState(
      typeof initialScrollLeft === "number" ? props.initialScrollLeft : 0
    );
    const [scrollTop, setScrollTop] = useState(
      typeof initialScrollTop === "number" ? props.initialScrollTop : 0
    );
    const [scrollUpdateWasRequested, setScrollUpdateWasRequested] =
      useState(false);

    /*
          const onAction = (action)=>{
            switch(action.type){
              case IS_SCROLLING:
  
  
              default:
                break;
            }
          }
  
        */

    // Make hook useCacheManager which will return all cache

    const cellCache = useRef(new Map());
    const cellStyleCache = useRef(new Map());
    const rowStyleCache = useRef(new Map());

    /*
          const onAction = (action)=>{
            switch(action.type){
              case SET_CELL_CACHE:
  
              default:
                onExtenralOnACtion
            }
          }
  
        */

    const resetIsScrollingTimeoutId = useRef(null);

    // initInstance function not required, simply make an oject
    const instanceInfo = useRef(initInstanceProps(props)); // props -> { estimatedColumnWidth, estimatedRowHeight }
    const outerRef = useRef(null);

    // Wrap in useCallback
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
      resetIsScrollingDebounced();
    };

    // Wrap in useCallback
    const scrollToItem = ({ align = "auto", columnIndex, rowIndex }) => {
      const { columnCount, height, rowCount, width } = props;
      const scrollbarSize = getScrollbarSize();
      let newColumnIndex =
        columnIndex ?? Math.max(0, Math.min(columnIndex, columnCount - 1));
      let newRowIndex =
        rowIndex ?? Math.max(0, Math.min(rowIndex, rowCount - 1));

      const estimatedTotalHeight = getEstimatedTotalHeight(
        props,
        instanceInfo.current
      );
      const estimatedTotalWidth = getEstimatedTotalWidth(
        props,
        instanceInfo.current
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
              instanceInfo.current,
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
              instanceInfo.current,
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
        if (props.direction === "rtl") {
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
    }, [scrollUpdateWasRequested, scrollLeft, scrollTop]);

    const callOnItemsRendered = (
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
      });
    const callPropsCallbacks = () => {
      const { columnCount, onItemsRendered, rowCount } = props;
      if (typeof onItemsRendered === "function") {
        if (columnCount > 0 && rowCount > 0) {
          const [
            overscanColumnStartIndex,
            overscanColumnStopIndex,
            visibleColumnStartIndex,
            visibleColumnStopIndex,
          ] = getHorizontalRangeToRender(
            props,
            instanceInfo,
            scrollLeft,
            isScrolling,
            horizontalScrollDirection
          );
          const [
            overscanRowStartIndex,
            overscanRowStopIndex,
            visibleRowStartIndex,
            visibleRowStopIndex,
          ] = getVerticalRangeToRender(props, instanceInfo, scrollTop);
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
    };

    const outerRefSetter = useCallback((ref) => {
      outerRef.current = ref;
    }, []);

    const resetIsScrollingDebounced = () => {
      if (resetIsScrollingTimeoutId.current) {
        cancelTimeout(resetIsScrollingTimeoutId.current);
      }

      resetIsScrollingTimeoutId.current = requestTimeout(
        resetIsScrolling,
        IS_SCROLLING_DEBOUNCE_INTERVAL
      );
    };

    const resetIsScrolling = () => {
      resetIsScrollingTimeoutId.current = null;

      setIsScrolling(false);
      // Clear style cache after state update has been committed and the size of cache has exceeded its max value.
      // way we don't break pure sCU for items that don't use isScrolling param.
      if (cellCache.current.size > 1000) {
        // convert all constant value into enum/constant
        cellCache.current.clear(); // = new Map(); //{}; // depends on time compx
      }
      if (cellStyleCache.current.size > 1000) {
        cellStyleCache.current.clear(); // = new Map(); //{};
      }
      if (rowStyleCache.current.size > 1000) {
        rowStyleCache.current.clear(); // = new Map(); //{};
      }
    };

    const [columnStartIndex, columnStopIndex] = getHorizontalRangeToRender(
      props,
      instanceInfo,
      scrollLeft,
      isScrolling,
      horizontalScrollDirection
    );
    const [rowStartIndex, rowStopIndex] = getVerticalRangeToRender(
      props,
      instanceInfo,
      scrollTop
    );

    const items = [];
    if (props.columnCount > 0 && props.rowCount) {
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
              cellCache,
              cellStyleCache,
              instanceInfo,
              props
            )
          );
        }
        items.push(
          <div
            children={rows}
            rowindex={rowIndex}
            key={`${rowIndex}`}
            style={getRowStyle(
              rowIndex,
              rowStyleCache,
              isScrolling,
              instanceInfo,
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
      instanceInfo.current
    );
    const estimatedTotalWidth = getEstimatedTotalWidth(
      props,
      instanceInfo.current
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

export default VariableSizeGrid;

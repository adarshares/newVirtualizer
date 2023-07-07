// @flow

import memoizeOne from "memoize-one";
import { createElement, PureComponent } from "react";
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
  return class Grid extends PureComponent {
    _instanceProps = initInstanceProps(this.props, this);
    _resetIsScrollingTimeoutId = null;
    _outerRef;
    _cellCache = new Map(); // {};
    _cellStyleCache = new Map(); // {};
    _rowStyleCache = new Map(); // {};

    static defaultProps = {
      direction: "ltr",
      itemData: undefined,
      useIsScrolling: false,
    };

    state = {
      instance: this,
      isScrolling: false,
      horizontalScrollDirection: "forward",
      scrollLeft:
        typeof this.props.initialScrollLeft === "number"
          ? this.props.initialScrollLeft
          : 0,
      scrollTop:
        typeof this.props.initialScrollTop === "number"
          ? this.props.initialScrollTop
          : 0,
      scrollUpdateWasRequested: false,
      verticalScrollDirection: "forward",
    };

    // Always use explicit constructor for React components.
    // It produces less code after transpilation. (#26)
    // eslint-disable-next-line no-useless-constructor
    constructor(props) {
      super(props);
    }

    static getDerivedStateFromProps(nextProps, prevState) {
      validateSharedProps(nextProps, prevState);
      validateProps(nextProps);
      return null;
    }

    scrollTo({ scrollLeft, scrollTop }) {
      if (scrollLeft !== undefined) {
        scrollLeft = Math.max(0, scrollLeft);
      }
      if (scrollTop !== undefined) {
        scrollTop = Math.max(0, scrollTop);
      }

      this.setState((prevState) => {
        if (scrollLeft === undefined) {
          scrollLeft = prevState.scrollLeft;
        }
        if (scrollTop === undefined) {
          scrollTop = prevState.scrollTop;
        }

        if (
          prevState.scrollLeft === scrollLeft &&
          prevState.scrollTop === scrollTop
        ) {
          return null;
        }

        return {
          isScrolling: true,
          horizontalScrollDirection:
            prevState.scrollLeft < scrollLeft ? "forward" : "backward",
          scrollLeft: scrollLeft,
          scrollTop: scrollTop,
          scrollUpdateWasRequested: true,
          verticalScrollDirection:
            prevState.scrollTop < scrollTop ? "forward" : "backward",
        };
      }, this._resetIsScrollingDebounced);
    }

    scrollToItem({ align = "auto", columnIndex, rowIndex }) {
      const { columnCount, height, rowCount, width } = this.props;
      const { scrollLeft, scrollTop } = this.state;
      const scrollbarSize = getScrollbarSize();

      if (columnIndex !== undefined) {
        columnIndex = Math.max(0, Math.min(columnIndex, columnCount - 1));
      }
      if (rowIndex !== undefined) {
        rowIndex = Math.max(0, Math.min(rowIndex, rowCount - 1));
      }

      const estimatedTotalHeight = getEstimatedTotalHeight(
        this.props,
        this._instanceProps
      );
      const estimatedTotalWidth = getEstimatedTotalWidth(
        this.props,
        this._instanceProps
      );

      // The scrollbar size should be considered when scrolling an item into view,
      // to ensure it's fully visible.
      // But we only need to account for its size when it's actually visible.
      const horizontalScrollbarSize =
        estimatedTotalWidth > width ? scrollbarSize : 0;
      const verticalScrollbarSize =
        estimatedTotalHeight > height ? scrollbarSize : 0;

      this.scrollTo({
        scrollLeft:
          columnIndex !== undefined
            ? getOffsetForColumnAndAlignment(
                this.props,
                columnIndex,
                align,
                scrollLeft,
                this._instanceProps,
                verticalScrollbarSize
              )
            : scrollLeft,
        scrollTop:
          rowIndex !== undefined
            ? getOffsetForRowAndAlignment(
                this.props,
                rowIndex,
                align,
                scrollTop,
                this._instanceProps,
                horizontalScrollbarSize
              )
            : scrollTop,
      });
    }

    componentDidMount() {
      const { initialScrollLeft, initialScrollTop } = this.props;

      if (this._outerRef != null) {
        const outerRef = this._outerRef;
        if (typeof initialScrollLeft === "number") {
          outerRef.scrollLeft = initialScrollLeft;
        }
        if (typeof initialScrollTop === "number") {
          outerRef.scrollTop = initialScrollTop;
        }
      }

      this._callPropsCallbacks();
    }

    componentDidUpdate() {
      const { direction } = this.props;
      const { scrollLeft, scrollTop, scrollUpdateWasRequested } = this.state;

      if (scrollUpdateWasRequested && this._outerRef != null) {
        // TRICKY According to the spec, scrollLeft should be negative for RTL aligned elements.
        // This is not the case for all browsers though (e.g. Chrome reports values as positive, measured relative to the left).
        // So we need to determine which browser behavior we're dealing with, and mimic it.
        const outerRef = this._outerRef;
        if (direction === "rtl") {
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

      this._callPropsCallbacks();
    }

    componentWillUnmount() {
      if (this._resetIsScrollingTimeoutId !== null) {
        cancelTimeout(this._resetIsScrollingTimeoutId);
      }
    }

    render() {
      const {
        children,
        className,
        columnCount,
        direction,
        height,
        innerRef,
        innerElementType,
        innerTagName,
        itemData,
        itemKey = defaultItemKey,
        outerElementType,
        outerTagName,
        rowCount,
        style,
        useIsScrolling,
        width,
      } = this.props;
      const { isScrolling } = this.state;
      const [columnStartIndex, columnStopIndex] =
        this._getHorizontalRangeToRender();
      const [rowStartIndex, rowStopIndex] = this._getVerticalRangeToRender();

      // Read this value AFTER items have been created,
      // So their actual sizes (if variable) are taken into consideration.
      const estimatedTotalHeight = getEstimatedTotalHeight(
        this.props,
        this._instanceProps
      );
      const estimatedTotalWidth = getEstimatedTotalWidth(
        this.props,
        this._instanceProps
      );

      const items = [];
      if (columnCount > 0 && rowCount) {
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
            rows.push(this._getCell(rowIndex, columnIndex, isScrolling));
          }
          items.push(
            createElement("div", {
              children: rows,
              rowindex: rowIndex,
              key: `${rowIndex}`,
              style: this._getRowStyle(rowIndex, isScrolling),
              role: "row",
              "aria-rowindex": `${rowIndex + 1}`,
            })
          );
        }
      }
      //console.log("scrollTo", "createelement called");

      return createElement(
        outerElementType || outerTagName || "div",
        {
          className,
          ref: this._outerRefSetter,
          style: {
            position: "relative",
            height,
            width,
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
            willChange: "transform",
            direction,
            ...style,
          },
          role: "presentation",
        },
        createElement(innerElementType || innerTagName || "div", {
          children: items,
          ref: innerRef,
          style: {
            height: estimatedTotalHeight,
            pointerEvents: isScrolling ? "none" : undefined,
            width: estimatedTotalWidth,
          },
          role: "presentation",
        })
      );
    }

    _callOnItemsRendered = memoizeOne(
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
        this.props.onItemsRendered({
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

    _callPropsCallbacks() {
      const { columnCount, onItemsRendered, rowCount } = this.props;

      if (typeof onItemsRendered === "function") {
        if (columnCount > 0 && rowCount > 0) {
          const [
            overscanColumnStartIndex,
            overscanColumnStopIndex,
            visibleColumnStartIndex,
            visibleColumnStopIndex,
          ] = this._getHorizontalRangeToRender();
          const [
            overscanRowStartIndex,
            overscanRowStopIndex,
            visibleRowStartIndex,
            visibleRowStopIndex,
          ] = this._getVerticalRangeToRender();
          this._callOnItemsRendered(
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
    }

    // Lazily create and cache item styles while scrolling,
    // So that pure component sCU will prevent re-renders.
    // We maintain this cache, and pass a style prop rather than index,
    // So that List can clear cached styles and force item re-render if necessary.
    _getCell = (rowIndex, columnIndex, isScrolling) => {
      const key = `${rowIndex}:${columnIndex}`;
      if (!this._cellCache.has(key) || !isScrolling) {
        const cellRenderer = this.props.children;
        const cellStyle = this._getCellStyle(
          rowIndex,
          columnIndex,
          isScrolling
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
        this._cellCache.set(`${rowIndex}:${columnIndex}`, cell);
      }
      return this._cellCache.get(`${rowIndex}:${columnIndex}`);
    };
    _getCellStyle = (rowIndex, columnIndex, isScrolling) => {
      const key = `${rowIndex}:${columnIndex}`;
      if (!this._cellStyleCache.has(key) || !isScrolling) {
        const { direction } = this.props;
        const offset = getColumnOffset(
          this.props,
          columnIndex,
          this._instanceProps
        );
        const isRtl = direction === "rtl";
        const cellStyle = {
          position: "absolute",
          left: isRtl ? undefined : offset,
          right: isRtl ? offset : undefined,
          height: getRowHeight(this.props, rowIndex, this._instanceProps),
          width: getColumnWidth(this.props, columnIndex, this._instanceProps),
        };
        if (!isScrolling) {
          return cellStyle;
        }
        this._cellStyleCache.set(key, cellStyle);
      }
      return this._cellStyleCache.get(key);
    };
    _getRowStyle = (rowIndex, isScrolling) => {
      const key = `${rowIndex}`;
      if (!this._rowStyleCache.has(key) || !isScrolling) {
        const rowStyle = {
          position: "absolute",
          top: getRowOffset(this.props, rowIndex, this._instanceProps),
          height: getRowHeight(this.props, rowIndex, this._instanceProps),
          width: getEstimatedTotalWidth(this.props, this._instanceProps),
        };
        if (!isScrolling) {
          return rowStyle;
        }
        this._rowStyleCache.set(key, rowStyle);
      }
      return this._rowStyleCache.get(key);
    };
    // transform: `translateY(${getRowOffset(
    //   this.props,
    //   rowIndex,
    //   this._instanceProps
    // )}px)`,

    _getHorizontalRangeToRender() {
      const {
        columnCount,
        overscanColumnCount,
        overscanColumnsCount,
        overscanCount,
        rowCount,
      } = this.props;
      const { horizontalScrollDirection, isScrolling, scrollLeft } = this.state;

      const overscanCountResolved =
        overscanColumnCount || overscanColumnsCount || overscanCount || 1;

      if (columnCount === 0 || rowCount === 0) {
        return [0, 0, 0, 0];
      }

      const startIndex = getColumnStartIndexForOffset(
        this.props,
        scrollLeft,
        this._instanceProps
      );
      const stopIndex = getColumnStopIndexForStartIndex(
        this.props,
        startIndex,
        scrollLeft,
        this._instanceProps
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
    }

    _getVerticalRangeToRender() {
      const {
        columnCount,
        overscanCount,
        overscanRowCount,
        overscanRowsCount,
        rowCount,
      } = this.props;
      const { isScrolling, verticalScrollDirection, scrollTop } = this.state;

      const overscanCountResolved =
        overscanRowCount || overscanRowsCount || overscanCount || 1;

      if (columnCount === 0 || rowCount === 0) {
        return [0, 0, 0, 0];
      }

      const startIndex = getRowStartIndexForOffset(
        this.props,
        scrollTop,
        this._instanceProps
      );
      const stopIndex = getRowStopIndexForStartIndex(
        this.props,
        startIndex,
        scrollTop,
        this._instanceProps
      );

      // Overscan by one item in each direction so that tab/focus works.
      // If there isn't at least one extra item, tab loops back around.
      const overscanBackward =
        !isScrolling || verticalScrollDirection === "backward"
          ? Math.max(1, overscanCountResolved)
          : 1;
      const overscanForward =
        !isScrolling || verticalScrollDirection === "forward"
          ? Math.max(1, overscanCountResolved)
          : 1;

      return [
        Math.max(0, startIndex - overscanBackward),
        Math.max(0, Math.min(rowCount - 1, stopIndex + overscanForward)),
        startIndex,
        stopIndex,
      ];
    }

    _outerRefSetter = (ref) => {
      const { outerRef } = this.props;

      console.log(this._outerRef, ref);
      this._outerRef = ref;
      console.log("kisi me nahi aaya", outerRef);

      if (typeof outerRef === "function") {
        outerRef(ref);
        console.log("nahi isme aaya");
      } else if (
        outerRef != null &&
        typeof outerRef === "object" &&
        outerRef.hasOwnProperty("current")
      ) {
        outerRef.current = ref;
        console.log("isme aaya");
        console.log(ref);
      }
    };

    _resetIsScrollingDebounced = () => {
      if (this._resetIsScrollingTimeoutId !== null) {
        cancelTimeout(this._resetIsScrollingTimeoutId);
      }

      this._resetIsScrollingTimeoutId = requestTimeout(
        this._resetIsScrolling,
        IS_SCROLLING_DEBOUNCE_INTERVAL
      );
    };

    _resetIsScrolling = () => {
      this._resetIsScrollingTimeoutId = null;

      this.setState({ isScrolling: false }, () => {
        // Clear style cache after state update has been committed.
        // This way we don't break pure sCU for items that don't use isScrolling param.
        if (this._cellCache.size > 1000) {
          this._cellCache = new Map(); //{};
        }
        if (this._cellStyleCache.size > 1000) {
          this._cellStyleCache = new Map(); //{};
        }
        if (this._rowStyleCache.size > 1000) {
          this._rowStyleCache = new Map(); //{};
        }
      });
    };
  };
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

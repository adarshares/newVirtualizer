import React, { useEffect, useRef, useState } from "react";
import { memo } from "react";
import { findFirstIndex } from "./utils/findFirstIndex";
import { findLastIndex } from "./utils/findLastIndex";

const dynamicGrid = ({ initInstanceProps }) => {
  return memo(
    (
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
      initialScrollLeft,
      initialScrollTop,
      overscanColumnCount,
      overscanRowCount
    ) => {
      const instanceProps = initInstanceProps();
      //const [scrollTop,scrollLeft] = useState({0,0});
      const outerRef = useRef();
      const innerRef = useRef();
      const resetIsScrollingTimeoutId = null;
      const [scrollLeft, setScrollLeft] = useState(
        typeof initialScrollLeft === "number" ? initialScrollLeft : 0
      );
      const [scrollTop, setScrollTop] = useState(
        typeof initialScrollTop === "number" ? initialScrollTop : 0
      );
      const [isScrolling, setIsScrolling] = useState(false);

      const scrollTo = ({ scrollTop, scrollLeft }) => {
        setScrollLeft(scrollLeft);
        setScrollTop(scrollTop);
      };

      const getHorizontalRange = () => {
        const rowStartIndex = findFirstIndex(
          rowCount,
          instanceProps.rowMetaDataMap,
          scrollTop
        );
        const rowStopIndex = findLastIndex(
          rowCount,
          instanceProps.rowMetaDataMap,
          scrollTop,
          height
        );
        return [
          Math.max(0, rowStartIndex - overscanRowCount),
          Math.min(rowCount - 1, rowStopIndex + overscanRowCount),
        ];
      };
      const getVerticalRange = () => {
        const columnStartIndex = findFirstIndex(
          columnCount,
          instanceProps.columnMetaDataMap,
          scrollLeft
        );
        const columnStopIndex = findLastIndex(
          columnCount,
          instanceProps.columnMetaDataMap,
          scrollLeft,
          width
        );
        return [
          Math.max(0, columnStartIndex - overscanColumnCount),
          Math.min(columnCount - 1),
        ];
      };

      //component did mount
      useEffect(() => {
        if (outerRef.current) {
          outerRef.current.scrollLeft = initialScrollLeft;
          outerRef.current.scrollTop = initialScrollTop;
        }

        //callPropsCallbacks();

        return () => {
          if (resetIsScrollingTimeoutId !== null) {
            cancelTimeout(resetIsScrollingTimeoutId);
          }
        };
      }, []);

      //component did update
      useEffect(() => {
        const outerRef = outerRef.current;

        if (scrollUpdateWasRequested && outerRef != null) {
          outerRef.scrollLeft = Math.max(0, scrollLeft);
          outerRef.scrollTop = Math.max(0, scrollTop);
        }

        _callPropsCallbacks();
      }, [scrollLeft, scrollTop]);

      const items = [];
      return <></>;
    }
  );
};

export default dynamicGrid;

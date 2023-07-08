const useCacheManager = ({
  props,
  instanceProps,
  cellStyleCache,
  isScrolling,
}) => {
  const getCellStyle = (rowIndex, columnIndex) => {
    const key = `${rowIndex}:${columnIndex}`;
    return cellStyleCache.current.get(key);
  };

  const setCellStyle = () => {
    if (!cellStyleCache.current.has(key) || !isScrolling) {
      const { direction } = props;
      // Passing it as object
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
    }
  };

  return { getCellStyle, setCellStyle };
};

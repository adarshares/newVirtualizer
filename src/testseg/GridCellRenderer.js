import React from "react";

const GridCellRenderer = ({
  columnKey,
  rowIndex,
  style,
  columnIndex,
  columnOffset,
  DATA,
}) => {
  return (
    <div
      style={{
        ...style,
        borderRight: "1px solid rgba(134, 153, 166, 0.8)",
        borderBottom: "1px solid rgba(134, 153, 166, 0.8)",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textOverflow: "ellipsis",
        overflow: "hidden",
      }}
      role="gridcell"
      aria-colindex={columnIndex + columnOffset}
      aria-rowindex={`${rowIndex + 1}`}
      tabIndex={rowIndex + 1}
    >
      {DATA[rowIndex][columnKey]}
    </div>
  );
};

export default GridCellRenderer;

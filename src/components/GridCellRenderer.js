import React from "react";
import { DATA } from "../constants/data";

const GridCellRenderer = ({
  columnKey,
  rowIndex,
  style,
  columnIndex,
  columnOffset,
}) => {
  return (
    <div
      style={{
        ...style,
        borderRight: "1px solid rgba(134, 153, 166, 0.8)",
        borderBottom: "1px solid rgba(134, 153, 166, 0.8)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textOverflow: "ellipsis",
        overflow: "hidden",
      }}
      //aria-colindex="1"
      role="gridcell"
      aria-colindex={columnIndex + columnOffset}
      aria-rowindex={rowIndex}
    >
      {DATA[rowIndex][columnKey]}
    </div>
  );
};

export default GridCellRenderer;

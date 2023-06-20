import React from "react";
import { DATA } from "../constants/data";

const GridCellRenderer = ({ columnKey, rowIndex, style }) => {
  return (
    <div
      style={{
        ...style,
        borderRight: "1px solid rgba(134, 153, 166, 0.8)",
        borderTop: "1px solid rgba(134, 153, 166, 0.8)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textOverflow: "ellipsis",
        overflow: "hidden",
      }}
    >
      {DATA[rowIndex][columnKey]}
    </div>
  );
};

export default GridCellRenderer;

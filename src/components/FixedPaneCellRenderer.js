import React from "react";
import { DATA } from "./../constants/data";

const FixedPaneCellRenderer = ({ rowIndex, style, fixedColumns }) => {
  return (
    <div
      style={{
        ...style,
        display: "flex",
        flexDirection: "row",
        zIndex: 10,
        backgroundColor: "white",
      }}
      role="row"
      aria-rowindex={rowIndex + 1}
    >
      {fixedColumns.map((item, index) => {
        return (
          <div
            key={index}
            style={{
              height: 50,
              width: item.width,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              textOverflow: "ellipsis",
              overflow: "hidden",
              borderRight: "1px solid rgba(134, 153, 166, 0.8)",
              borderBottom: "1px solid rgba(134, 153, 166, 0.8)",
              boxSizing: "border-box",
            }}
            role="columnheader"
            aria-colindex={index}
            aria-rowindex={rowIndex + 1}
            tabIndex={rowIndex + 1}
          >
            {DATA[rowIndex][item.columnKey]}
          </div>
        );
      })}
    </div>
  );
};

export default FixedPaneCellRenderer;

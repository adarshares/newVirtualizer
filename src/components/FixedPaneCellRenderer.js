import React from "react";
import { DATA } from "./../constants/data";

/*
rowIndex={index}
                style={style}
                floatingColumns={floatingColumns}
              />
*/
const FixedPaneCellRenderer = ({ rowIndex, style, fixedColumns }) => {
  return (
    <div
      style={{
        ...style,
        display: "flex",
        flexDirection: "row",
        zIndex: 10,
        backgroundColor: "white",
        borderRight: "1px solid rgba(134, 153, 166, 0.8)",
        borderTop: "1px solid rgba(134, 153, 166, 0.8)",
      }}
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
            }}
          >
            {DATA[rowIndex][item.columnKey]}
          </div>
        );
      })}
    </div>
  );
};

export default FixedPaneCellRenderer;

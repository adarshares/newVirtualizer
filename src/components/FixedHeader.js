import React from "react";

const FixedHeader = ({ fixedColumns }) => {
  console.log(fixedColumns);
  return (
    <div
      style={{
        zIndex: 15,
        position: "sticky",
        top: 0,
        backgroundColor: "white",
        display: "flex",
      }}
      role="row"
      aria-rowindex={0}
    >
      {fixedColumns.map((item, index) => {
        return (
          <div
            key={index}
            style={{
              width: item.width,
              height: 50,
              zIndex: 15,
              backgroundColor: "rgba(73, 182, 255, 1)",
              borderRight: "1px solid rgba(134, 153, 166, 0.8)",
              borderBottom: "1px solid rgba(134, 153, 166, 0.8)",
              boxSizing: "border-box",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              textOverflow: "ellipsis",
              overflow: "hidden",
            }}
            role="columnheader"
            aria-colindex={index}
            aria-rowindex={0}
            tabIndex={0}
          >
            {item.displayName}
          </div>
        );
      })}
    </div>
  );
};

export default FixedHeader;

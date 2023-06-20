import React from "react";

const FloatingHeaderCellRenderer = ({
  displayName,
  style,
  columnIndex,
  columnOffset,
}) => {
  return (
    <div
      style={{
        ...style,
        backgroundColor: "rgba(179, 225, 255, 1)",
        zIndex: 5,
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
      aria-rowindex={0}
      aria-colindex={columnIndex + columnOffset}
      tabIndex={0}
    >
      {displayName}
    </div>
  );
};

export default FloatingHeaderCellRenderer;

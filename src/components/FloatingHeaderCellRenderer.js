import React from "react";

const FloatingHeaderCellRenderer = ({ displayName, style }) => {
  return (
    <div
      style={{
        ...style,
        backgroundColor: "rgba(179, 225, 255, 1)",
        zIndex: 5,
        // height: style.height - 1,
        //width: style.width - 0.45,
        borderLeft: "1px solid rgba(134, 153, 166, 0.8)",
        borderBottom: "1px solid rgba(134, 153, 166, 0.8)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textOverflow: "ellipsis",
        overflow: "hidden",
      }}
    >
      {console.log(style.height, style.width)}
      {displayName}
    </div>
  );
};

export default FloatingHeaderCellRenderer;

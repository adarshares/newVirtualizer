import React, { forwardRef } from "react";
import VariableSizeList from "../customChanges/VariableSizeList";
import FloatingHeaderCellRenderer from "./FloatingHeaderCellRenderer";

const FloatingHeader = forwardRef(
  ({ rowHeight, floatingColumns, fixedColumns }, ref) => {
    return (
      <VariableSizeList
        height={rowHeight}
        itemCount={floatingColumns.length}
        ref={ref}
        width={500}
        overscanCount={5}
        itemSize={(index) => floatingColumns[index].width}
        layout={"horizontal"}
        style={{
          overflow: "visible",
          position: "sticky",
          top: 0,
          zIndex: 5,
        }}
      >
        {({ index, style }) => (
          <FloatingHeaderCellRenderer
            style={style}
            displayName={floatingColumns[index].displayName}
            columnIndex={index}
            columnOffset={fixedColumns.length}
          />
        )}
      </VariableSizeList>
    );
  }
);

export default FloatingHeader;

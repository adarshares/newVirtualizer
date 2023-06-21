import React from "react";
import VariableSizeList from "../customChanges/VariableSizeList";
import FixedPaneCellRenderer from "./FixedPaneCellRenderer";
import { forwardRef } from "react";

const FixedPane = forwardRef(
  ({ DATA, rowHeight, widthOfFixedPane, fixedColumns }, ref) => {
    return (
      <VariableSizeList
        height={500}
        itemCount={DATA.length}
        itemSize={() => rowHeight}
        ref={ref}
        width={widthOfFixedPane}
        overscanCount={5}
        style={{
          overflow: "visible",
          position: "relative",
          backgroundColor: "white",
          zIndex: 10,
        }}
      >
        {({ index, style }) => (
          <FixedPaneCellRenderer
            rowIndex={index}
            style={{
              ...style,
              height: rowHeight,
              width: widthOfFixedPane,
            }}
            fixedColumns={fixedColumns}
            DATA={DATA}
          />
        )}
      </VariableSizeList>
    );
  }
);

export default FixedPane;

import React, { forwardRef } from "react";
import VariableSizeGrid from "../customChanges/VariableSizeGrid";
//import VariableSizeGrid from "../customChangesFunction/VariableSizeGrid";
import GridCellRenderer from "./GridCellRenderer";

const FloatingPane = forwardRef(
  ({ floatingColumns, DATA, fixedColumns }, ref) => {
    return (
      <VariableSizeGrid
        overscanRowCount={5}
        overscanColumnCount={5}
        columnCount={floatingColumns.length}
        columnWidth={(index) => floatingColumns[index].width}
        height={500}
        rowCount={DATA.length}
        rowHeight={(index) => 50}
        width={500}
        ref={ref}
        style={{ position: "relative", overflow: "visible" }}
      >
        {({ columnIndex, rowIndex, style }) => (
          <GridCellRenderer
            columnKey={floatingColumns[columnIndex].columnKey}
            rowIndex={rowIndex}
            style={style}
            columnIndex={columnIndex}
            columnOffset={fixedColumns.length}
            DATA={DATA}
          />
        )}
      </VariableSizeGrid>
    );
  }
);

export default FloatingPane;

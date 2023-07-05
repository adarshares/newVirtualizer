import React from "react";
import VariableSizeGrid from "./../customChanges/VariableSizeGrid";
import { DATA } from "../constants/data";
import { COLUMNS } from "../constants/constant";
import GridCellRenderer from "./GridCellRenderer";

const fixedColumns = COLUMNS.filter((item) => item.fixed);
const floatingColumns = COLUMNS.filter((item) => !item.fixed);

const DragGrid = () => {
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
};

export default DragGrid;

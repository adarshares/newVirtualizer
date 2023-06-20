import React from "react";
import { useRef } from "react";

import VariableSizeGrid from "./../customChanges/VariableSizeGrid";
import VariableSizeList from "./../customChanges/VariableSizeList";
import throttle from "lodash.throttle"; //16ms is 60 fps
import { DATA } from "./../constants/data";
import { COLUMNS } from "./../constants/constant";
import FixedPaneCellRenderer from "./../components/FixedPaneCellRenderer";
import GridCellRenderer from "./GridCellRenderer";
import FloatingHeaderCellRenderer from "./FloatingHeaderCellRenderer";
import FixedHeader from "./FixedHeader";

const Grid = () => {
  const refFixedPane = useRef();
  const refGrid = useRef();
  const refFloatingHeader = useRef();

  const fixedColumns = COLUMNS.filter((item) => item.fixed);
  const floatingColumns = COLUMNS.filter((item) => !item.fixed);
  const widthOfFixedPane = fixedColumns.reduce(
    (sum, item) => sum + item.width,
    0
  );
  const widthOfFloatingPane = floatingColumns.reduce(
    (sum, item) => sum + item.width,
    0
  );
  const totalWidth = widthOfFixedPane + widthOfFloatingPane;
  const rowHeight = 50;
  const totalHeight = (DATA.length + 1) * rowHeight;

  const handleScroll = (event) => {
    refFixedPane.current.scrollTo(event.target.scrollTop);
    refFloatingHeader.current.scrollTo(event.target.scrollLeft);
    refGrid.current.scrollTo({
      scrollLeft: event.target.scrollLeft,
      scrollTop: event.target.scrollTop,
    });
  };

  return (
    <>
      <div
        style={{
          height: 550,
          width: widthOfFixedPane + 500,
          overflow: "scroll",
        }}
        onScroll={handleScroll}
        role="presentation"
      >
        <div
          style={{ height: totalHeight, width: totalWidth, display: "flex" }}
          role="presentation"
        >
          <div
            style={{
              height: totalHeight,
              width: widthOfFixedPane,
              position: "sticky",
              left: 0,
              zIndex: 15,
            }}
            role="grid"
            aria-rowcount={`${DATA.length + 1}`}
            aria-colcount={`${fixedColumns.length}`}
          >
            {/* fixedHeader */}
            <FixedHeader fixedColumns={fixedColumns} />

            {/* fixedpane */}
            <VariableSizeList
              height={500}
              itemCount={DATA.length}
              itemSize={() => rowHeight}
              ref={refFixedPane}
              width={widthOfFixedPane}
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
                />
              )}
            </VariableSizeList>
          </div>

          <div
            style={{
              height: totalHeight - rowHeight,
              width: widthOfFloatingPane,
            }}
            role="grid"
            aria-rowcount={`${DATA.length + 1}`}
            aria-colcount={`${COLUMNS.length}`}
          >
            {/* floating header */}
            <VariableSizeList
              height={rowHeight}
              itemCount={floatingColumns.length}
              ref={refFloatingHeader}
              width={500}
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

            {/* floating columns grid */}
            <VariableSizeGrid
              columnCount={floatingColumns.length}
              columnWidth={(index) => floatingColumns[index].width}
              height={500}
              rowCount={DATA.length}
              rowHeight={(index) => 50}
              width={500}
              ref={refGrid}
              style={{ position: "relative", overflow: "visible" }}
            >
              {({ columnIndex, rowIndex, style }) => (
                <GridCellRenderer
                  columnKey={floatingColumns[columnIndex].columnKey}
                  rowIndex={rowIndex}
                  style={style}
                  columnIndex={columnIndex}
                  columnOffset={fixedColumns.length}
                />
              )}
            </VariableSizeGrid>
          </div>
        </div>
      </div>
    </>
  );
};
export default Grid;

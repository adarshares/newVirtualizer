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
import FixedPane from "./FixedPane";
import FloatingHeader from "./FloatingHeader";
import FloatingPane from "./FloatingPane";

const Grid = () => {
  const refFixedPane = useRef();
  const refFloatingPane = useRef();
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
    refFloatingPane.current.scrollTo({
      scrollLeft: event.target.scrollLeft,
      scrollTop: event.target.scrollTop,
    });
  };

  return (
    <>
      <div
        id="tablebody"
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
            <FixedPane
              DATA={DATA}
              rowHeight={rowHeight}
              widthOfFixedPane={widthOfFixedPane}
              fixedColumns={fixedColumns}
              ref={refFixedPane}
            />
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
            <FloatingHeader
              rowHeight={rowHeight}
              floatingColumns={floatingColumns}
              fixedColumns={fixedColumns}
              ref={refFloatingHeader}
            />
            {/* floating columns grid */}
            <FloatingPane
              floatingColumns={floatingColumns}
              DATA={DATA}
              fixedColumns={fixedColumns}
              ref={refFloatingPane}
            />
          </div>
        </div>
      </div>
    </>
  );
};
export default Grid;

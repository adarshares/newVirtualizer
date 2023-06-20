import logo from "./logo.svg";
import "./App.css";
import VariableSizeGrid from "./customChanges/VariableSizeGrid";
import Grid from "./components/Grid";
// import VariableSizeList from "./customChanges/VariableSizeList";
// import throttle from "lodash.throttle"; //16ms is 60 fps
// import { DATA } from "./constants/data";
// import { COLUMNS } from "./constants/constant";
// import FixedPaneCellRenderer from "./components/FixedPaneCellRenderer";

//700x700 px2 variable size grid
const columnWidths = new Array(1000)
  .fill(true)
  .map(() => 75 + Math.round(Math.random() * 50));
const rowHeights = new Array(1000)
  .fill(true)
  .map(() => 25 + Math.round(Math.random() * 50));

const Cell = ({ columnIndex, rowIndex, style }) => (
  <div style={style}>
    Item {rowIndex},{columnIndex}
  </div>
);

function App() {
  return (
    <>
      {/* <VariableSizeGrid
        columnCount={1000}
        columnWidth={(index) => columnWidths[index]}
        height={700}
        rowCount={1000}
        rowHeight={(index) => rowHeights[index]}
        width={700}
      >
        {Cell}
      </VariableSizeGrid> */}
      <Grid />
    </>
  );
}

export default App;
/*
        <div
      style={{
        height: "100px",
        width: "100px",
        position: "relative",
        overflowY: "scroll",
        overflowX: "scroll",
      }}
      onScroll={handleScroll}
    >
      <div
        style={{ backgroundColor: "beige", height: "500px", width: "500px" }}
      >
        {arr.map((item, index) => {
          if (index == 3) {
            return null;
          }
          return (
            <div
              key={index}
              style={{
                height: "100px",
                width: "100%",
                paddingTop: index !== 4 ? "0px" : "100px",
              }}
            >
              {item}
            </div>
          );
        })}
      </div>
    </div>
*/

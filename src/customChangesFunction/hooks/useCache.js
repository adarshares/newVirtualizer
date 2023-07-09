import { useRef } from "react";
import { ACTION_TYPES } from "./action_types";
export const useCache = () => {
  const cellCache = useRef(new Map());
  const cellStyleCache = useRef(new Map());
  const rowStyleCache = useRef(new Map());

  const clearCache = () => {
    if (cellCache.current.size > 1000) {
      cellCache.current.clear(); // = new Map(); //{};//test performance
    }
    if (cellStyleCache.current.size > 1000) {
      cellStyleCache.current.clear(); // = new Map(); //{};
    }
    if (rowStyleCache.current.size > 1000) {
      rowStyleCache.current.clear(); // = new Map(); //{};
    }
  };

  const getCache = (action) => {
    switch (action.type) {
      case ACTION_TYPES.GET_CELL:
        return cellCache;
      case ACTION_TYPES.GET_CELL_STYLE:
        return cellStyleCache;
      case ACTION_TYPES.GET_ROW_STYLE:
        return rowStyleCache;
      default:
        break;
    }
  };

  const setCache = (action) => {
    switch (action.type) {
      case ACTION_TYPES.CLEAR_CACHE:
        clearCache();
        break;
      default:
        break;
    }
  };
  return { getCache, setCache };
};

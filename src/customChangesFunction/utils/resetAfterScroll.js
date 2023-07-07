import { cancelTimeout } from "../helpers/timer";
import { requestTimeout } from "../helpers/timer";

export const _resetIsScrollingDebounced = (_resetIsScrollingTimeoutId) => {
  if (_resetIsScrollingTimeoutId.current) {
    cancelTimeout(_resetIsScrollingTimeoutId.current);
  }

  _resetIsScrollingTimeoutId.current = requestTimeout(
    _resetIsScrolling,
    IS_SCROLLING_DEBOUNCE_INTERVAL
  );
};

export const _resetIsScrolling = (
  _resetIsScrollingTimeoutId,
  setIsScrolling,
  _cellCache,
  _cellStyleCache,
  _rowStyleCache
) => {
  _resetIsScrollingTimeoutId.current = null;

  setIsScrolling(false);
  // Clear style cache after state update has been committed.
  // way we don't break pure sCU for items that don't use isScrolling param.
  if (_cellCache.current.size > 1000) {
    _cellCache.current.clear(); // = new Map(); //{};
  }
  if (_cellStyleCache.current.size > 1000) {
    _cellStyleCache.current.clear(); // = new Map(); //{};
  }
  if (_rowStyleCache.current.size > 1000) {
    _rowStyleCache.current.clear(); // = new Map(); //{};
  }
};

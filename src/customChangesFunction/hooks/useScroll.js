import { useCallback, useState } from "react";

import { ACTION_TYPES } from "./action_types";

export const useScroll = ({ initialScrollLeft, initialScrollTop }) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [horizontalScrollDirection, setHorizontalScrollDirection] =
    useState("forward");
  const [scrollLeft, setScrollLeft] = useState(
    typeof initialScrollLeft === "number" ? initialScrollLeft : 0
  );
  const [scrollTop, setScrollTop] = useState(
    typeof initialScrollTop === "number" ? initialScrollTop : 0
  );
  const [scrollUpdateWasRequested, setScrollUpdateWasRequested] =
    useState(false);

  //console.log("useScrollCalled");

  const onAction = useCallback((action) => {
    switch (action.type) {
      case ACTION_TYPES.SCROLL_START:
        setIsScrolling(true);
        break;
      case ACTION_TYPES.SCROLL_STOP:
        setIsScrolling(false);
        break;
      case ACTION_TYPES.SET_SCROLL_LEFT:
        setScrollLeft(action.payload);
        break;
      case ACTION_TYPES.SET_SCROLL_TOP:
        setScrollTop(action.payload);
        break;
      case ACTION_TYPES.REQUEST_SCROLL_UPDATE:
        setScrollUpdateWasRequested(true);
        break;
      case ACTION_TYPES.DENY_SCROLL_UPDATE:
        setScrollUpdateWasRequested(false);
        break;
      default:
        break;
    }
  }, []);

  return {
    isScrolling,
    horizontalScrollDirection,
    scrollLeft,
    scrollTop,
    scrollUpdateWasRequested,
    onAction,
  };
};

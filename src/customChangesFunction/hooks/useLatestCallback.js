import { useCallback } from "react";

import { useLatest } from "./useLatest";

export const useLatestCallback = (callback) => {
  const latestCallback = useLatest(callback);

  return useCallback(
    (...args) => latestCallback.current(...args),
    [latestCallback]
  );
};

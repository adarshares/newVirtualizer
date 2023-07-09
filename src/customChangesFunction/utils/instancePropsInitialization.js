const DEFAULT_ESTIMATED_ITEM_SIZE = 50;

const BASE_VIRTUALISED_INSTANCE = {
  columnMetadataMap: {},
  lastMeasuredColumnIndex: -1,
  lastMeasuredRowIndex: -1,
  rowMetadataMap: {},
};

// change name
export const initInstanceProps = (props) => {
  const { estimatedColumnWidth, estimatedRowHeight } = props;

  return {
    ...BASE_VIRTUALISED_INSTANCE,
    estimatedColumnWidth: estimatedColumnWidth || DEFAULT_ESTIMATED_ITEM_SIZE,
    estimatedRowHeight: estimatedRowHeight || DEFAULT_ESTIMATED_ITEM_SIZE,
  };

  //return virtualizationParams;
};

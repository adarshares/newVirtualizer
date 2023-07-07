const DEFAULT_ESTIMATED_ITEM_SIZE = 50;
export const initInstanceProps = (props) => {
  const { estimatedColumnWidth, estimatedRowHeight } = props;

  const instanceProps = {
    columnMetadataMap: {},
    estimatedColumnWidth: estimatedColumnWidth || DEFAULT_ESTIMATED_ITEM_SIZE,
    estimatedRowHeight: estimatedRowHeight || DEFAULT_ESTIMATED_ITEM_SIZE,
    lastMeasuredColumnIndex: -1,
    lastMeasuredRowIndex: -1,
    rowMetadataMap: {},
  };

  return instanceProps;
};

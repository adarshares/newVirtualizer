//****************************UNCHECKED FUNCTION*************************************
const queryIndex = (nodeLeft, nodeRight, segIndex, offset, segtree) => {
  if (nodeLeft === nodeRight) {
    return nodeLeft;
  }
  if (segtree[2 * segIndex] < offset) {
    return queryIndex(
      Math.floor((nodeLeft + nodeRight) / 2) + 1,
      nodeRight,
      2 * segIndex + 1,
      offset - segtree[2 * segIndex],
      segtree
    );
  } else {
    return queryIndex(
      nodeLeft,
      Math.floor((nodeLeft + nodeRight) / 2),
      2 * segIndex,
      offset,
      segtree
    );
  }
};

//***PARTIALLY CHECKED FUNCTION ****
const replaceElement = (
  nodeLeft,
  nodeRight,
  segIndex,
  nodeIndex,
  value,
  segtree
) => {
  //nl,nr,n, i,v,
  //console.log(nodeLeft, nodeRight, segIndex, nodeIndex, value, segtree);
  if (nodeIndex === nodeLeft && nodeLeft === nodeRight) {
    segtree[segIndex] = value;
    return;
  }
  const nodeMid = Math.floor((nodeLeft + nodeRight) / 2);
  if (nodeIndex <= nodeMid) {
    replaceElement(nodeLeft, nodeMid, 2 * segIndex, nodeIndex, value, segtree);
  } else {
    replaceElement(
      nodeMid + 1,
      nodeRight,
      2 * segIndex + 1,
      nodeIndex,
      value,
      segtree
    );
  }
  segtree[segIndex] = segtree[2 * segIndex] + segtree[2 * segIndex + 1];
};

const sumquery = (
  nodeLeft,
  nodeRight,
  queryLeft,
  queryRight,
  segIndex,
  segtree
) => {
  if (queryLeft > nodeRight || queryRight < nodeLeft || nodeLeft > nodeRight) {
    return 0;
  }
  if (nodeLeft >= queryLeft && nodeRight <= queryRight) {
    return segtree[segIndex];
  }
  return (
    sumquery(
      nodeLeft,
      Math.floor((nodeLeft + nodeRight) / 2),
      queryLeft,
      queryRight,
      2 * segIndex,
      segtree
    ) +
    sumquery(
      Math.floor((nodeLeft + nodeRight) / 2) + 1,
      nodeRight,
      queryLeft,
      queryRight,
      2 * segIndex + 1,
      segtree
    )
  );
};
//****************************************************//

export const getSize = (segtree, index) => {
  return sumquery(0, segtree.length / 4 - 1, index, index, 1, segtree);
};

export const getOffset = (segtree, index) => {
  if (index <= 0) {
    return 0;
  }
  return sumquery(0, segtree.length / 4 - 1, 0, index - 1, 1, segtree);
};

export const getIndex = (segtree, offset) => {
  if (offset === 0) {
    return 0;
  }
  return queryIndex(0, segtree.length / 4 - 1, 1, offset, segtree);
};

export const setSize = (segtree, index, size) => {
  replaceElement(0, segtree.length / 4 - 1, 1, index, size, segtree);
};
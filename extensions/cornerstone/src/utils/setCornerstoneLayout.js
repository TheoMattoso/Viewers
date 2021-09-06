import { redux } from '@ohif/core';

const { setLayout } = redux.actions;

/**
 * Update the current layout with a simple Cornerstone one
 *
 * @return void
 */
const setCornerstoneLayout = (
  numRows = 1,
  numColumns = 1,
  isFusionEnabled = false
) => {
  let viewports = Array(numRows * numColumns).fill({ plugin: 'cornerstone' });
  const layout = {
    numRows,
    numColumns,
    viewports,
    isFusionEnabled,
  };

  const action = setLayout(layout);

  window.store.dispatch(action);
};

export default setCornerstoneLayout;

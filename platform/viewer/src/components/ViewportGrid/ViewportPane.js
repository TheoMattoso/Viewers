import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './ViewportPane.css';
import { Select } from '@ohif/ui';
import OHIFImageFusion from '../OHIFImageFusion/OHIFImageFusion';
import cornerstone from 'cornerstone-core';

const ViewportPane = props => {
  const { children, onDrop, viewportIndex, className: propClassName } = props;
  const { displaySet, studies } = children.props.viewportData;
  const [{ hovered, highlighted }, drop] = useDrop({
    accept: 'thumbnail',
    drop: (droppedItem, monitor) => {
      const canDrop = monitor.canDrop();
      const isOver = monitor.isOver();

      if (canDrop && isOver && onDrop) {
        const { StudyInstanceUID, displaySetInstanceUID } = droppedItem;

        onDrop({ viewportIndex, StudyInstanceUID, displaySetInstanceUID });
      }
    },
    // Monitor, and collect props.
    // Returned as values by `useDrop`
    collect: monitor => ({
      highlighted: monitor.canDrop(),
      hovered: monitor.isOver(),
    }),
  });

  const presetArray = [];
  cornerstone.colors
    .getColormapsList()
    .filter(preset => preset.name)
    .forEach(preset =>
      presetArray.push({ key: preset.name, value: preset.id })
    );

  const [selectedColorMap, setSelectedColorMap] = useState('');

  const colorPaletteComp = displaySet.fusion
    ? renderColorPalette(presetArray, selectedColorMap, setSelectedColorMap)
    : null;

  const renderedChildren = displaySet.fusion
    ? renderFusion(studies, viewportIndex, selectedColorMap)
    : children;

  return (
    <div
      className={classNames(
        'viewport-drop-target',
        { hovered: hovered },
        { highlighted: highlighted },
        propClassName
      )}
      ref={drop}
      data-cy={`viewport-container-${viewportIndex}`}
    >
      {colorPaletteComp}
      {renderedChildren}
    </div>
  );
};

const renderFusion = (studies, viewportIndex, selectedColorMap) => {
  console.log(selectedColorMap);
  return (
    <OHIFImageFusion
      studies={studies}
      viewportIndex={viewportIndex}
      colorMap={selectedColorMap}
    />
    // {/* <div className="display">
    //   <div className="message">
    //     <i className="fa fa-exclamation-triangle"></i>
    //   </div>
    //   <div className="info">
    //     <span>Image fusion will be displayed here</span>
    //   </div>
    // </div> */}
  );
};

const renderColorPalette = (presetArray, selected, selectedFunction) => {
  return (
    <Select
      style={{ color: 'white' }}
      data-cy="file-type"
      value={selected}
      onChange={event => selectedFunction(event.target.value)}
      options={presetArray}
      label={'Select a color palette:'}
    />
  );
};

ViewportPane.propTypes = {
  children: PropTypes.node.isRequired,
  viewportIndex: PropTypes.number.isRequired,
  onDrop: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default ViewportPane;

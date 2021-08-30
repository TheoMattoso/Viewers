import React from 'react';
import { useDrop } from 'react-dnd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './ViewportPane.css';
import { Select } from '@ohif/ui';
import vtkColorMaps from '../../../../../extensions/vtk/src/ColorMaps.js';

const ViewportPane = function(props) {
  const { children, onDrop, viewportIndex, className: propClassName } = props;
  const { displaySet } = children.props.viewportData;
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
  vtkColorMaps.rgbPresetNames.map(preset => {
    presetArray.push({ key: preset, value: preset });
  });

  const colorPaletteComp = displaySet.fusion
    ? renderColorPalette(presetArray)
    : null;

  console.log(displaySet);
  const renderedChildren = displaySet.fusion
    ? renderFusion(displaySet)
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

const renderFusion = displaySet => {
  return (
    <div className="display">
      <div className="message">
        <i className="fa fa-exclamation-triangle"></i>
      </div>
      <div className="info">
        <span>Image fusion will be displayed here</span>
        {displaySet.imageFusion}
      </div>
    </div>
  );
};

const renderColorPalette = presetArray => {
  return (
    <Select
      style={{ color: 'white' }}
      data-cy="file-type"
      onChange={console.log}
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

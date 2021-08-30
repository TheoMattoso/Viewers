import React from 'react';
import cornerstone from 'cornerstone-core';

export default class OHIFImageFusion extends React.Component {
  componentDidMount() {
    var { displaySets } = this.props.studies[0];

    var PET = displaySets.filter(
      displaySet => displaySet.SeriesDescription === 'PET AC'
    );
    var CT = displaySets.filter(
      displaySet => displaySet.SeriesDescription === 'CT IMAGES'
    );

    var layers = [];
    PET.forEach(petInstance => {
      petInstance.images.forEach(image => {
        let imageId = `wadors:${image._instance.wadorsuri}`;
        layers.push({
          imageId: imageId,
          options: {
            name: 'PT',
            opacity: 1,
          },
        });
      });
    });

    CT.forEach(ctInstance => {
      ctInstance.images.forEach(image => {
        let imageId = `wadors:${image._instance.wadorsuri}`;
        layers.push({
          imageId: imageId,
          options: {
            name: 'CT',
            opacity: 0.7,
            viewport: {
              colormap: 'hotIron' /** pegar via props */,
            },
          },
        });
      });
    });

    const element = document.querySelector('#element');
    cornerstone.enable(element);
    this.loadLayers(element, layers);
  }

  componentWillUnmount() {
    const element = document.querySelector('#element');
    cornerstone.disable(element);
  }

  updateSelectedLayer(element, layerId) {
    const layers = document.getElementById('layers');
    const currentLayerId = layers.value;
    if (currentLayerId !== layerId) {
      layers.value = layerId;
      element.dispatchEvent(new Event('change'));
    }
  }

  loadLayers(element, layers) {
    this.loadImages(layers).then(images => {
      images.forEach((image, index) => {
        const layer = layers[index];
        cornerstone.addLayer(element, image, layer.options);
        cornerstone.updateImage(element);
      });
      const layersDropdown = document.getElementById('layers');
      layersDropdown.addEventListener('change', event => {
        const layerId = event.currentTarget.value;
        cornerstone.setActiveLayer(element, layerId);
      });
    });
  }

  loadImages(layers) {
    const promises = [];
    layers.forEach(layer => {
      const loadPromise = cornerstone.loadAndCacheImage(layer.imageId);
      promises.push(loadPromise);
    });
    return Promise.all(promises);
  }

  render() {
    return (
      <div className="container">
        <h1>Composite Images</h1>
        This example shows you how to add and interact with layers.
        <div className="row">
          <div className="col-xs-2">
            <label>Viewport Values:</label>
            <div>
              <span>Viewport Scale: </span>
              <span id="layerViewportScale"></span>
            </div>
          </div>
          <div className="col-xs-4">
            <label>Layer CT Values:</label>
            <div>
              <span>Viewport Scale: </span>
              <span id="layer1ViewportScale"></span>
            </div>
            <div>
              <span>Layer Viewport Scale: </span>
              <span id="layer1LayerViewportScale"></span>
            </div>
            <div>
              <span>Layer Sync Scale: </span>
              <span id="layer1LayerSyncScale"></span>
            </div>
          </div>
          <div className="col-xs-4">
            <label>Layer PET Values:</label>
            <div>
              <span>Layer Viewport Scale: </span>
              <span id="layer2LayerViewportScale"></span>
            </div>
            <div>
              <span>Layer Sync Scale: </span>
              <span id="layer2LayerSyncScale"></span>
            </div>
          </div>
        </div>
        <div className="row" style={{ paddingTop: 20 }}>
          <div className="col-xs-10">
            <div
              id="element"
              style={{
                width: 512,
                height: 512,
                top: 0,
                left: 0,
                position: 'absolute',
              }}
              onContextMenu="return false"
              onMouseDown="return false"
            ></div>
          </div>
          <div className="col-xs-2">
            <div style={{ marginBottom: 15 }}>
              <label htmlFor="syncViewports">
                {' '}
                Sync Viewports
                <input
                  id="syncViewports"
                  name="syncViewports"
                  type="checkbox"
                  checked
                />
              </label>
              <br />
            </div>
            <label htmlFor="layers">Select active layer</label>
            <select
              name="layers"
              id="layers"
              size="2"
              style={{
                width: '100%',
                minWidth: 150,
              }}
            ></select>
            <div
              id="properties"
              style={{ width: '100%', minWidth: 150, marginTop: 15 }}
            >
              <label>Layer Properties</label>
              <div style={{ width: '100%', padding: '5px 5px 5px 10px' }}>
                <div style={{ marginBottom: 15 }}>
                  <label htmlFor="visible">
                    {' '}
                    Visible
                    <input name="visible" type="checkbox" checked />
                  </label>
                  <br />
                </div>
                <div style={{ marginBottom: 15 }}>
                  <label htmlFor="colormaps"> Colormap </label>
                  <select id="colormaps" style={{ width: '100%' }}>
                    <option value="">None</option>
                  </select>
                </div>
                <div style={{ marginBottom: 15 }}>
                  <label htmlFor="imageOpacity"> Opacity</label>
                  <input
                    id="imageOpacity"
                    type="range"
                    className="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={0}
                  ></input>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

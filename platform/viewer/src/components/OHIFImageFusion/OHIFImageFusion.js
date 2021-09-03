import React from 'react';
import cornerstone from 'cornerstone-core';

export default class OHIFImageFusion extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidUpdate() {
    const element = document.querySelector('#element');
    const layer = cornerstone.getActiveLayer(element);
    if (!layer) return;
    layer.viewport.colormap = this.props.colorMap;
    cornerstone.updateImage(element);
  }

  componentDidMount() {
    var { displaySets } = this.props.studies[0];
    /** Agregar o mesmo SeriesNumber */

    var PET = displaySets.filter(
      displaySet => displaySet.SeriesDescription === 'PET NAC'
    );

    var CT = displaySets.filter(
      displaySet => displaySet.SeriesDescription === 'CT IMAGES'
    );

    var layers = [];

    CT.forEach(ctInstance => {
      var image = ctInstance.images[124];
      let imageId = `wadors:${image._instance.wadorsuri}`;
      layers.push({
        imageId: imageId,
        options: {
          name: 'CT',
          opacity: 1,
        },
      });
      // ctInstance.images.forEach(image => {

      // });
    });

    PET.forEach(petInstance => {
      var image = petInstance.images[124];
      let imageId = `wadors:${image._instance.wadorsuri}`;
      layers.push({
        imageId: imageId,
        options: {
          name: 'PT',
          opacity: 0.7,
        },
      });
      // petInstance.images.forEach(image => { });
    });

    const element = document.querySelector('#element');
    cornerstone.enable(element);
    this.loadLayers(element, layers);
  }

  componentWillUnmount() {
    const element = document.querySelector('#element');
    cornerstone.disable(element);
  }

  loadLayers(element, layers) {
    this.loadImages(layers).then(images => {
      var layerId = '';
      images.forEach((image, index) => {
        const layer = layers[index];
        layerId = cornerstone.addLayer(element, image, layer.options);
        cornerstone.updateImage(element);
      });
      cornerstone.setActiveLayer(element, layerId);
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
    return <div id="element" style={{ width: '80%', height: '80%' }}></div>;
  }
}

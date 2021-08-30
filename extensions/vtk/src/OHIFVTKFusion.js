import React from 'react';
import OHIF from '@ohif/core';
import { api } from 'dicomweb-client';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import { getImageData, loadImageData, View2D } from 'react-vtkjs-viewport';
import { resolveObjectPath } from '../../../platform/core/src/utils';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';

window.cornerstoneWADOImageLoader = cornerstoneWADOImageLoader;

const { DICOMWeb } = OHIF;
let studyInstanceUID, ctSeriesInstanceUID, petSeriesInstanceUID;

function OHIFVTKFusion(props) {
  return (
    <div>
      ok2
      {generateImageData(props)}
    </div>
  );
}

function generateImageData(props) {
  let imageFusion = props.imageFusion;
  let servers = props.servers;

  console.log('imageFusion: ', imageFusion);

  studyInstanceUID = imageFusion.STUDY;
  ctSeriesInstanceUID = imageFusion.CT;
  petSeriesInstanceUID = imageFusion.PT;

  const searchInstanceOptions = {
    studyInstanceUID,
  };

  const dicomWebClient = getDicomWebClientFromServer(servers);
  console.log('dicomWebClient: ', dicomWebClient);

  let baseUrl = dicomWebClient.baseURL;

  console.log('Mounted');
  const imageIdPromise = createStudyImageIds(
    baseUrl,
    dicomWebClient,
    searchInstanceOptions
  );
  console.log('imageIdPromise: ', imageIdPromise);

  let imagesCT = [imageFusion['CT']];
  const ctImageDataObject = loadDataset(imagesCT, 'ctDisplaySet', 'CT');

  let imagesPT = [imageFusion['PT']];
  const petImageDataObject = loadDataset(imagesPT, 'petDisplaySet', 'PT');

  console.log('CT: ', ctImageDataObject);
  console.log('PT: ', petImageDataObject);

  const ctImageData = ctImageDataObject.vtkImageData;
  const petImageData = petImageDataObject.vtkImageData;

  console.log('ctImageData: ', ctImageData);
  console.log('petImageData: ', petImageData);

  const ctVol = createCT2dPipeline(ctImageData);
  const petVol = createPET2dPipeline(petImageData, 'hsv');

  console.log('ctVol: ', ctVol);
  console.log('petVol: ', petVol);
  console.log('ctVol: ', ctVol.getVolumes());
  console.log('petVol: ', petVol.getVolumes());

  return (
    <View2D
      volumes={[ctVol, petVol]}
      orientation={{ sliceNormal: [1, 0, 0], viewUp: [0, 0, 1] }}
    />
  );
}

async function createStudyImageIds(baseUrl, client, studySearchOptions) {
  const SOP_INSTANCE_UID = '00080018';
  const SERIES_INSTANCE_UID = '0020000E';

  console.log('baseUrl: ', baseUrl);
  console.log('client: ', client);
  console.log('studySearchOptions: ', studySearchOptions);

  const instances = await client.retrieveStudyMetadata(studySearchOptions);

  const instancesToRetrieve = [];

  const imageIds = instances.map(instanceMetaData => {
    const seriesInstanceUID = instanceMetaData[SERIES_INSTANCE_UID].Value[0];
    const sopInstanceUID = instanceMetaData[SOP_INSTANCE_UID].Value[0];

    const imageId =
      'wadors:' +
      baseUrl +
      '/studies/' +
      studyInstanceUID +
      '/series/' +
      seriesInstanceUID +
      '/instances/' +
      sopInstanceUID +
      '/frames/1';

    console.log('imageId: ', imageId);

    if (imageId) {
      cornerstoneWADOImageLoader.wadors.metaDataManager.add(
        imageId,
        instanceMetaData
      );
    }

    if (
      seriesInstanceUID === ctSeriesInstanceUID ||
      seriesInstanceUID === petSeriesInstanceUID
    ) {
      instancesToRetrieve.push({
        studyInstanceUID,
        seriesInstanceUID,
        sopInstanceUID,
      });
    }

    return imageId;
  });

  return imageIds;
}

function createActorMapper(imageData) {
  const mapper = vtkVolumeMapper.newInstance();
  mapper.setInputData(imageData);

  const actor = vtkVolume.newInstance();
  actor.setMapper(mapper);

  return {
    actor,
    mapper,
  };
}

function createCT2dPipeline(imageData) {
  const { actor } = createActorMapper(imageData);
  const cfun = vtkColorTransferFunction.newInstance();
  /*
  0: { description: 'Soft tissue', window: 400, level: 40 },
  1: { description: 'Lung', window: 1500, level: -600 },
  2: { description: 'Liver', window: 150, level: 90 },
  3: { description: 'Bone', window: 2500, level: 480 },
  4: { description: 'Brain', window: 80, level: 40 },*/
  const preset = vtkColorMaps.getPresetByName('Grayscale');
  cfun.applyColorMap(preset);
  cfun.setMappingRange(-360, 440);

  actor.getProperty().setRGBTransferFunction(0, cfun);

  return actor;
}

function createPET2dPipeline(imageData, petColorMapId) {
  const { actor, mapper } = createActorMapper(imageData);
  mapper.setSampleDistance(1.0);

  const cfun = vtkColorTransferFunction.newInstance();
  const preset = vtkColorMaps.getPresetByName(petColorMapId);
  cfun.applyColorMap(preset);
  cfun.setMappingRange(0, 5);

  actor.getProperty().setRGBTransferFunction(0, cfun);

  // Create scalar opacity function
  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(0, 0.0);
  ofun.addPoint(0.1, 0.9);
  ofun.addPoint(5, 1.0);

  actor.getProperty().setScalarOpacity(0, ofun);

  return actor;
}

function loadDataset(imageIds, displaySetInstanceUid, modality) {
  const imageDataObject = getImageData(imageIds, displaySetInstanceUid);

  const percentageCompleteStateName = `percentComplete${modality}`;

  loadImageData(imageDataObject);

  const numberOfFrames = imageIds.length;

  const onPixelDataInsertedCallback = numberProcessed => {
    const percentComplete = Math.floor(
      (numberProcessed * 100) / numberOfFrames
    );

    // if (this.state.percentComplete !== percentComplete) {
    //   const stateUpdate = {};

    //   stateUpdate[percentageCompleteStateName] = percentComplete;

    //   this.setState(stateUpdate);
    // }

    if (percentComplete % 20 === 0) {
      //this.rerenderAll();
    }
  };

  const onAllPixelDataInsertedCallback = () => {
    //this.rerenderAll();
  };

  imageDataObject.onPixelDataInserted(onPixelDataInsertedCallback);
  imageDataObject.onAllPixelDataInserted(onAllPixelDataInsertedCallback);

  return imageDataObject;
}

function getActiveServerFromServer(server) {
  const servers = resolveObjectPath(server, 'servers');
  if (Array.isArray(servers) && servers.length > 0) {
    return servers.find(server => resolveObjectPath(server, 'active') === true);
  }
}

function getDicomWebClientFromServer(servers) {
  const activeServer = getActiveServerFromServer(servers);
  return new api.DICOMwebClient({
    url: activeServer.wadoRoot,
    headers: DICOMWeb.getAuthorizationHeader(activeServer),
  });
}

export default OHIFVTKFusion;

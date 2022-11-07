import { VolumeActor } from './../../../core/src/types/IActor';
/**
 * WARNING
 * DO NOT REMOVE ANY OF THE BELOW IMPORT STATEMENTS
 * SOME ARE USED FOR SOME OF THE TUTORIALS, AND WILL BREAK IF REMOVED
 */

import {
  RenderingEngine,
  Enums,
  volumeLoader,
  setVolumesForViewports,
} from '@cornerstonejs/core';
import {
  addTool,
  ToolGroupManager,
  ZoomTool,
  Enums as csToolsEnums,
  BidirectionalTool,
  SegmentationDisplayTool,
  BrushTool,
  segmentation,
} from '@cornerstonejs/tools';

import {
  initDemo,
  createImageIdsAndCacheMetaData,
  setTitleAndDescription,
} from '../../../../utils/demo/helpers';

// This is for debugging purposes
console.warn(
  'Click on index.ts to open source code for this example --------->'
);

// ============================= //
// ======== Set up page ======== //
setTitleAndDescription(
  'Tutorial Playground',
  'The playground for you to copy paste the codes in the tutorials and run it'
);

const { ViewportType } = Enums;
/**
 * Runs the demo
 */
async function run() {
  // Init Cornerstone and related libraries
  await initDemo();

  // Get Cornerstone imageIds and fetch metadata into RAM
  const imageIds = await createImageIdsAndCacheMetaData({
    StudyInstanceUID:
      '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463',
    SeriesInstanceUID:
      '1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561',
    wadoRsRoot: 'https://d3t6nz73ql33tx.cloudfront.net/dicomweb',
    type: 'STACK',
  });

  const content = document.getElementById('content');

  const viewportGrid = document.createElement('div');
  viewportGrid.style.display = 'flex';
  viewportGrid.style.flexDirection = 'row';

  const element1 = document.createElement('div');
  element1.style.width = '500px';
  element1.style.height = '500px';

  const element2 = document.createElement('div');
  element2.style.width = '500px';
  element2.style.height = '500px';

  const element3 = document.createElement('div');
  element3.style.width = '500px';
  element3.style.height = '500px';

  viewportGrid.appendChild(element1);
  viewportGrid.appendChild(element2);
  viewportGrid.appendChild(element3);

  content.appendChild(viewportGrid);

  addTool(SegmentationDisplayTool);
  addTool(BrushTool);

  const toolGroupId = 'CT_TOOLGROUP';
  const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

  toolGroup.addTool(SegmentationDisplayTool.toolName);
  toolGroup.addTool(BrushTool.toolName);

  toolGroup.setToolEnabled(SegmentationDisplayTool.toolName);
  toolGroup.setToolActive(BrushTool.toolName, {
    bindings: [
      {
        mouseButton: csToolsEnums.MouseBindings.Primary,
      },
    ],
  });

  const volumeName = 'CT_VOLUME_ID';
  const volumeLoaderScheme = 'cornerstoneStreamingImageVolume';
  const volumeId = `${volumeLoaderScheme}:${volumeName}`;

  const volume = await volumeLoader.createAndCacheVolume(volumeId, {
    imageIds,
  });

  const segmentationId = 'VUNO_SEGMENTATION_ID';
  await volumeLoader.createAndCacheDerivedVolume(volumeId, {
    volumeId: segmentationId,
  });

  segmentation.addSegmentations([
    {
      segmentationId,
      representation: {
        type: csToolsEnums.SegmentationRepresentations.Labelmap,
        data: {
          volumeId: segmentationId,
        },
      },
    },
  ]);

  const renderingEngineId = 'vunoRenderingEngine';
  const renderingEngine = new RenderingEngine(renderingEngineId);

  const viewportId1 = 'CT_AXIAL';
  const viewportId2 = 'CT_SAGITTAL';
  const viewportId3 = 'CT_CORONAL';

  const viewportInputArray = [
    {
      viewportId: viewportId1,
      type: ViewportType.ORTHOGRAPHIC,
      element: element1,
      defaultOptions: {
        orientation: Enums.OrientationAxis.AXIAL,
      },
    },
    {
      viewportId: viewportId2,
      type: ViewportType.ORTHOGRAPHIC,
      element: element2,
      defaultOptions: {
        orientation: Enums.OrientationAxis.SAGITTAL,
      },
    },
    {
      viewportId: viewportId3,
      type: ViewportType.ORTHOGRAPHIC,
      element: element3,
      defaultOptions: {
        orientation: Enums.OrientationAxis.CORONAL,
      },
    },
  ];

  renderingEngine.setViewports(viewportInputArray);

  toolGroup.addViewport(viewportId1, renderingEngineId);
  toolGroup.addViewport(viewportId2, renderingEngineId);
  toolGroup.addViewport(viewportId3, renderingEngineId);

  volume.load();

  await setVolumesForViewports(
    renderingEngine,
    [
      {
        volumeId,
        callback: ({ volumeActor }) => {
          volumeActor
            .getProperty()
            .getRGBTransferFunction(0)
            .setMappingRange(-180, 220);
        },
      },
    ],
    [viewportId1, viewportId2, viewportId3]
  );

  await segmentation.addSegmentationRepresentations(toolGroupId, [
    {
      segmentationId,
      type: csToolsEnums.SegmentationRepresentations.Labelmap,
    },
  ]);

  renderingEngine.renderViewports([viewportId1, viewportId2, viewportId3]);
}

run();

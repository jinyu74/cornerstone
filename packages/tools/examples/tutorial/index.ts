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

  const element1 = document.createElement('div');
  element1.oncontextmenu = (e) => e.preventDefault();
  element1.style.width = '500px';
  element1.style.height = '500px';

  const element2 = document.createElement('div');
  element2.oncontextmenu = (e) => e.preventDefault();
  element2.style.width = '500px';
  element2.style.height = '500px';

  content.appendChild(element1);
  content.appendChild(element2);

  const renderingEngineId = 'vunoRenderingEngine';
  const renderingEngine = new RenderingEngine(renderingEngineId);

  const volumeId = 'cornerstoneStreamingImageVolume: vunoVolume';
  const volume = await volumeLoader.createAndCacheVolume(volumeId, {
    imageIds,
  });

  const viewportId1 = 'CT_AXIAL';
  const viewportId2 = 'CT_SAGITTAL';

  const viewportInput = [
    {
      viewportId: viewportId1,
      element: element1,
      type: ViewportType.ORTHOGRAPHIC,
      defaultOptions: {
        orientation: Enums.OrientationAxis.AXIAL,
      },
    },
    {
      viewportId: viewportId2,
      element: element2,
      type: ViewportType.ORTHOGRAPHIC,
      defaultOptions: {
        orientation: Enums.OrientationAxis.SAGITTAL,
      },
    },
  ];

  renderingEngine.setViewports(viewportInput);

  addTool(BidirectionalTool);
  addTool(ZoomTool);

  const toolGroupId = 'vunoToolGroup';
  const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

  toolGroup.addTool(BidirectionalTool.toolName);
  toolGroup.addTool(ZoomTool.toolName);
  toolGroup.addViewport(viewportId1, renderingEngineId);
  toolGroup.addViewport(viewportId2, renderingEngineId);

  toolGroup.setToolActive(BidirectionalTool.toolName, {
    bindings: [
      {
        mouseButton: csToolsEnums.MouseBindings.Primary,
      },
    ],
  });
  toolGroup.setToolActive(ZoomTool.toolName, {
    bindings: [
      {
        mouseButton: csToolsEnums.MouseBindings.Secondary,
      },
    ],
  });

  volume.load();

  setVolumesForViewports(
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
    [viewportId1, viewportId2]
  );

  renderingEngine.renderViewports([viewportId1, viewportId2]);
}

run();

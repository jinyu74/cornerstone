/**
 * WARNING
 * DO NOT REMOVE ANY OF THE BELOW IMPORT STATEMENTS
 * SOME ARE USED FOR SOME OF THE TUTORIALS, AND WILL BREAK IF REMOVED
 */

import {
  RenderingEngine,
  // Types,
  Enums,
  // setVolumesForViewports,
  // volumeLoader,
} from '@cornerstonejs/core';
// import {
//   addTool,
//   BrushTool,
//   SegmentationDisplayTool,
//   BidirectionalTool,
//   ToolGroupManager,
//   WindowLevelTool,
//   ZoomTool,
//   segmentation,
//   Enums as csToolsEnums,
// } from '@cornerstonejs/tools';
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
  const element = document.createElement('div');

  element.style.width = '500px';
  element.style.height = '500px';

  content.appendChild(element);

  const renderingEngineId = 'vunoRenderingEngine';
  const renderingEngine = new RenderingEngine(renderingEngineId);

  const viewportId = 'CT_AXIAL_STACK';

  const viewportInput = [
    {
      viewportId,
      element,
      type: ViewportType.STACK,
    },
  ];

  // renderingEngine.enableElement(viewportInput);
  renderingEngine.setViewports(viewportInput);

  const viewport = renderingEngine.getViewport(viewportId);
  viewport.setStack(imageIds, 60);
  viewport.render();

  console.warn(viewport.getCurrentImageId());
}

run();

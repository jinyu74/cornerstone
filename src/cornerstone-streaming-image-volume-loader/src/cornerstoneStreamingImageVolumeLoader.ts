import {
  registerVolumeLoader,
  registerUnknownVolumeLoader,
  cache,
  Utilities,
  ERROR_CODES,
} from '@cornerstone'
import { vec3 } from 'gl-matrix'
import { makeVolumeMetadata, sortImageIdsAndGetSpacing } from './helpers'
import StreamingImageVolume from './StreamingImageVolume'

const { createUint8SharedArray, createFloat32SharedArray } = Utilities

function cornerstoneStreamingImageVolumeLoader(
  volumeId: string,
  options: {
    imageIds: Array<string>
  }
): {
  // TODO: VolumeLoader interface?
  promise: Promise<StreamingImageVolume>
  cancelFn: () => void
} {
  if (!options || !options.imageIds || !options.imageIds.length) {
    throw new Error(
      'ImageIds must be provided to create a streaming image volume'
    )
  }

  const { imageIds } = options

  const volumeMetadata = makeVolumeMetadata(imageIds)

  const {
    BitsAllocated,
    PixelRepresentation,
    PhotometricInterpretation,
    ImageOrientationPatient,
    PixelSpacing,
    Columns,
    Rows,
  } = volumeMetadata

  const rowCosineVec = vec3.fromValues(
    ImageOrientationPatient[0],
    ImageOrientationPatient[1],
    ImageOrientationPatient[2]
  )
  const colCosineVec = vec3.fromValues(
    ImageOrientationPatient[3],
    ImageOrientationPatient[4],
    ImageOrientationPatient[5]
  )

  const scanAxisNormal = vec3.create()

  vec3.cross(scanAxisNormal, rowCosineVec, colCosineVec)

  const { zSpacing, origin, sortedImageIds } = sortImageIdsAndGetSpacing(
    imageIds,
    scanAxisNormal
  )

  const numFrames = imageIds.length

  // Spacing goes [1] then [0], as [1] is column spacing (x) and [0] is row spacing (y)
  const spacing = [PixelSpacing[1], PixelSpacing[0], zSpacing]
  const dimensions = [Columns, Rows, numFrames]
  const direction = [...rowCosineVec, ...colCosineVec, ...scanAxisNormal]
  const signed = PixelRepresentation === 1

  // Check if it fits in the cache before we allocate data
  // TODO Improve this when we have support for more types
  const bytesPerVoxel = BitsAllocated === 16 ? 4 : 1
  const sizeInBytes =
    bytesPerVoxel * dimensions[0] * dimensions[1] * dimensions[2]

  if (!cache.isCachable(sizeInBytes)) {
    throw new Error(ERROR_CODES.CACHE_SIZE_EXCEEDED)
  }
  // if so, start erasing volatile data so you can allocate

  let numComponents = 1
  if (PhotometricInterpretation === 'RGB') {
    numComponents = 3
  }

  let scalarData

  switch (BitsAllocated) {
    case 8:
      if (signed) {
        throw new Error(
          '8 Bit signed images are not yet supported by this plugin.'
        )
      } else {
        scalarData = createUint8SharedArray(
          dimensions[0] * dimensions[1] * dimensions[2]
        )
      }

      break

    case 16:
      scalarData = createFloat32SharedArray(
        dimensions[0] * dimensions[1] * dimensions[2]
      )

      break

    case 24:
      // hacky because we don't support alpha channel in dicom
      scalarData = createUint8SharedArray(
        dimensions[0] * dimensions[1] * dimensions[2] * numComponents
      )

      break
  }

  const streamingImageVolume = new StreamingImageVolume(
    // ImageVolume properties
    {
      uid: volumeId,
      metadata: volumeMetadata,
      dimensions,
      spacing,
      origin,
      direction,
      scalarData,
      sizeInBytes,
    },
    // Streaming properties
    {
      imageIds: sortedImageIds,
      loadStatus: {
        // todo: loading and loaded should be on ImageVolume
        loaded: false,
        loading: false,
        cachedFrames: [],
        callbacks: [],
      },
    }
  )

  return {
    promise: Promise.resolve(streamingImageVolume),
    cancelFn: () => {
      streamingImageVolume.cancelLoading()
    },
  }
}

registerUnknownVolumeLoader(cornerstoneStreamingImageVolumeLoader)
registerVolumeLoader(
  'cornerstoneStreamingImageVolume',
  cornerstoneStreamingImageVolumeLoader
)

export default cornerstoneStreamingImageVolumeLoader
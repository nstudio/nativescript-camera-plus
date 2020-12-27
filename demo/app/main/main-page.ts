import { EventData, Page } from '@nativescript/core';
import { CameraPlus } from '@nstudio/nativescript-camera-plus/camera-plus.ios';
import { HelloWorldModel } from './main-view-model';

// Event handler for Page 'loaded' event attached in main-page.xml
export function pageLoaded(args: EventData) {
  // Get the event sender
  const page = args.object as Page;
  page.bindingContext = new HelloWorldModel(page);
}

export function camLoaded(args: any) {
  const cam = args.object as CameraPlus;
  console.info('Cam loaded event');

  (async () => {
    if (!cam.hasCameraPermission()) {
      await cam.requestCameraPermissions();
    }
    cam.autoFocus = true;

    logFlashMode(cam);
    logAvailablePictureSizes(cam);
    logSupportRatios(cam);
  })();
}

function logFlashMode(cam: CameraPlus): void {
  try {
    const flashMode = cam.getFlashMode();
    console.info(`Flash Mode: ${flashMode}`);
  } catch (error) {
    console.error(`Flash Mode: Failed to load: ${error.message}`);
    console.error(error.stack);
  }
}

function logAvailablePictureSizes(cam: CameraPlus): void {
  const ratio = '16:9';
  const availableSizes = cam.getAvailablePictureSizes('16:9');
  console.info(`Picture Sizes Available for ${ratio}:`);
  for (const size of availableSizes) {
    console.info(`Height: ${size.height}, Width: ${size.width}`);
  }
  console.info(`Total sizes available: ${availableSizes.length}`);
}

function logSupportRatios(cam: CameraPlus): void {
  const supportedRatios = cam.getSupportedRatios();
  if (supportedRatios.length === 0) {
    console.warn('Ratios supported: None found.');
  } else {
    console.info('Ratios supported:' + supportedRatios.join(', '));
  }
}

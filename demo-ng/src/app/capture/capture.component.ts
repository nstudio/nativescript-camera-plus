import { Component, NgZone } from '@angular/core';
import { ImageAsset, ImageSource } from '@nativescript/core';
import {
  CameraLoadedEvent,
  CameraPlus,
  ImagesSelectedEvent,
  PhotoCapturedEvent,
  ToggleCameraEvent,
} from '@nstudio/nativescript-camera-plus';

@Component({
  selector: 'ns-capture',
  moduleId: module.id,
  styleUrls: ['./capture.component.css'],
  templateUrl: './capture.component.html',
})
export class CaptureComponent {
  public imageSource: ImageSource;
  public showOverlay = false;
  public overlayChanged = 0;

  private cam: CameraPlus;
  private readonly tag = '[demo-ng]';

  constructor(private zone: NgZone) {}

  public cameraLoadedEvent(event: CameraLoadedEvent): void {
    console.info(`${this.tag}: Cam loaded.`);
    this.logCamEvent('CameraPlus.cameraLoadedEvent', event);
    this.cam = event.object;

    (async () => {
      if (!this.cam.hasCameraPermission()) {
        await this.cam.requestCameraPermissions();
      }
      this.cam.autoFocus = true;

      const flashMode = this.cam.getFlashMode();
      // Turn flash on at startup
      if (flashMode === 'off') {
        this.cam.toggleFlash();
      }

      this.logFlashMode();
      this.logAvailablePictureSizes();
      this.logSupportRatios();
    })();
  }

  private logFlashMode(): void {
    try {
      const flashMode = this.cam.getFlashMode();
      console.info(`Flash Mode: ${flashMode}`);
    } catch (error) {
      console.error(`Flash Mode: Failed to load: ${error.message}`);
      console.error(error.stack);
    }
  }

  private logAvailablePictureSizes(): void {
    const ratio = '16:9';
    const availableSizes = this.cam.getAvailablePictureSizes('16:9');
    console.info(`Picture Sizes Available for ${ratio}:`);
    for (const size of availableSizes) {
      console.info(`Height: ${size.height}, Width: ${size.width}`);
    }
    console.info(`Total sizes available: ${availableSizes.length}`);
  }

  private logSupportRatios(): void {
    const supportedRatios = this.cam.getSupportedRatios();
    if (supportedRatios.length === 0) {
      console.warn('Ratios supported: None found.');
    } else {
      console.info('Ratios supported:' + supportedRatios.join(', '));
    }
  }

  public imagesSelectedEvent(event: ImagesSelectedEvent): void {
    console.info(`${this.tag}: Image Selected.`);
    this.logCamEvent('CameraPlus.imagesSelectedEvent', event);
    this.loadImage(event.data[0]);
  }

  public photoCapturedEvent(event: PhotoCapturedEvent): void {
    console.info(`${this.tag}: Photo Captured.`);
    this.logCamEvent('CameraPlus.photoCapturedEvent', event);
    this.loadImage(event.data);
  }

  public toggleCameraEvent(event: ToggleCameraEvent): void {
    console.info(`${this.tag}: Camera Toggled.`);
    this.logCamEvent('CameraPlus.toggleCameraEvent', event);
  }

  public recordDemoVideo(): void {
    try {
      console.info(`${this.tag}: Start recording`);
      this.cam.record({
        saveToGallery: true,
      });
    } catch (err) {
      console.error(err);
    }
  }

  public stopRecordingDemoVideo(): void {
    try {
      console.info(`${this.tag}: Stop recording`);
      this.cam.stop();
      console.info(`${this.tag}: After Stop recording`);
    } catch (err) {
      console.error(err);
    }
  }

  public toggleFlashOnCam(): void {
    console.info(`${this.tag}: Toggle Flash.`);
    this.cam.toggleFlash();
  }

  public toggleTheCamera(): void {
    console.info(`${this.tag}: Toggle Camera.`);
    this.cam.toggleCamera();
  }

  public openCamPlusLibrary(): void {
    console.info(`${this.tag}: Open Cam Plus Library.`);
    this.cam.chooseFromLibrary();
  }

  public takePicFromCam(): void {
    console.info(`${this.tag}: Take Pic From Cam.`);
    this.cam.takePicture({ saveToGallery: true });
  }

  public toggleOverlay(): void {
    console.info(`${this.tag}: Toggle Overlay. Toggle again to reveal different examples.`);
    this.showOverlay = !this.showOverlay;
    if (this.showOverlay) {
      this.overlayChanged++;
    }
  }

  private async loadImage(imageAsset: ImageAsset): Promise<void> {
    if (imageAsset) {
      try {
        const imgSrc = await ImageSource.fromAsset(imageAsset);
        if (imgSrc) {
          this.zone.run(() => {
            this.imageSource = imgSrc;
          });
        } else {
          this.imageSource = null;
          alert('Image source is bad.');
        }
      } catch (error) {
        this.imageSource = null;
        console.log('Error getting image source: ');
        console.error(error);
        alert('Error getting image source from asset');
      }
    } else {
      console.log('Image Asset was null');
      alert('Image Asset was null');
      this.imageSource = null;
    }
  }

  private logCamEvent(listenerName: string, event: any) {
    console.log(`${this.tag}: ${listenerName}`);
    console.log(`Name: ${event.eventName}`);
    console.log(`Data: ${event.data}`);
    console.log(`Object: ${event.object}`);
    console.log(`Message: ${event.message}`);
  }
}

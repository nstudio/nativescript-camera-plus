import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
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
export class CaptureComponent implements OnInit, OnDestroy {
  public imageSource: ImageSource;
  public showOverlay = false;
  public overlayChanged = 0;

  private cam: CameraPlus;
  private readonly tag = '[demo-ng]';

  constructor(private zone: NgZone) {}

  ngOnInit(): void {}

  ngOnDestroy() {}

  public cameraLoadedEvent(event: CameraLoadedEvent): void {
    console.info(`${this.tag}: Cam loaded.`);
    this.logCamEvent('CameraPlus.cameraLoadedEvent', event);
    this.cam = event.object;

    const flashMode = this.cam.getFlashMode();
    // Turn flash on at startup
    if (flashMode === 'off') {
      this.cam.toggleFlash();
    }

    // TEST THE ICONS SHOWING/HIDING
    // this.cam.showCaptureIcon = true;
    // this.cam.showFlashIcon = true;
    // this.cam.showGalleryIcon = false;
    // this.cam.showToggleIcon = false;
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
      console.log(`*** start recording ***`);
      this.cam.record();
    } catch (err) {
      console.log(err);
    }
  }

  public stopRecordingDemoVideo(): void {
    try {
      console.log(`*** stop recording ***`);
      this.cam.stop();
      console.log(`*** after this.cam.stop() ***`);
    } catch (err) {
      console.log(err);
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

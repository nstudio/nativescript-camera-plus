import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ImageAsset } from '@nativescript/core/image-asset';
import { ImageSource } from '@nativescript/core/image-source';
import { CameraPlus } from '@nstudio/nativescript-camera-plus';

@Component({
  selector: 'ns-capture',
  moduleId: module.id,
  styleUrls: ['./capture.component.css'],
  templateUrl: './capture.component.html'
})
export class CaptureComponent implements OnInit, OnDestroy {
  private cam: CameraPlus;
  public imageSource: ImageSource;

  constructor(private zone: NgZone) {}

  ngOnInit(): void {}

  ngOnDestroy() {}

  public camLoaded(e: any): void {
    console.log('***** cam loaded *****');
    this.cam = e.object as CameraPlus;

    const flashMode = this.cam.getFlashMode();

    // Turn flash on at startup
    if (flashMode === 'off') {
      this.cam.toggleFlash();
    }

    // TEST THE ICONS SHOWING/HIDING
    // this.cameraPlus.showCaptureIcon = true;
    // this.cameraPlus.showFlashIcon = true;
    // this.cameraPlus.showGalleryIcon = false;
    // this.cameraPlus.showToggleIcon = false;
  }

  public imagesSelectedEvent(e: any): void {
    console.log('IMAGES SELECTED EVENT!!!');
    this.loadImage((e.data as ImageAsset[])[0]);
  }

  public photoCapturedEvent(e: any): void {
    console.log('PHOTO CAPTURED EVENT!!!');
    this.loadImage(e.data as ImageAsset);
  }

  public toggleCameraEvent(e: any): void {
    console.log('camera toggled');
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
    this.cam.toggleFlash();
  }

  public toggleShowingFlashIcon(): void {
    console.log(`showFlashIcon = ${this.cam.showFlashIcon}`);
    this.cam.showFlashIcon = !this.cam.showFlashIcon;
  }

  public toggleTheCamera(): void {
    this.cam.toggleCamera();
  }

  public openCamPlusLibrary(): void {
    this.cam.chooseFromLibrary();
  }

  public takePicFromCam(): void {
    this.cam.takePicture({ saveToGallery: true });
  }

  private loadImage(imageAsset: ImageAsset): void {
    if (imageAsset) {
      ImageSource.fromAsset(imageAsset).then(
        imgSrc => {
          if (imgSrc) {
            this.zone.run(() => {
              this.imageSource = imgSrc;
            });
          } else {
            this.imageSource = null;
            alert('Image source is bad.');
          }
        },
        err => {
          this.imageSource = null;
          console.log('Error getting image source: ');
          console.error(err);
          alert('Error getting image source from asset');
        }
      );
    } else {
      console.log('Image Asset was null');
      alert('Image Asset was null');
      this.imageSource = null;
    }
  }
}

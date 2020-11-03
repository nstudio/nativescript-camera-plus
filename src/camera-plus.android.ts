/**********************************************************************************
 * (c) 2017, nStudio, LLC & LiveShopper, LLC
 *
 * Version 1.1.0                                                    team@nStudio.io
 **********************************************************************************/

/// <reference path="./node_modules/@nativescript/types-android/index.d.ts" />

import * as permissions from 'nativescript-permissions';
import {
  AndroidActivityResultEventData,
  AndroidApplication,
  Application,
  Device,
  ImageAsset,
  Utils,
  View,
} from '@nativescript/core';
import {
  CameraPlusBase,
  CameraVideoQuality,
  CLog,
  GetSetProperty,
  ICameraOptions,
  ICameraPlusEvents,
  IChooseOptions,
  IVideoOptions,
  WhiteBalance,
} from './camera-plus.common';
import * as CamHelpers from './helpers';
import { SelectedAsset } from './selected-asset';
export * from './camera-plus.common';
export { CameraVideoQuality, WhiteBalance } from './camera-plus.common';
const REQUEST_VIDEO_CAPTURE = 999;
const WRAP_CONTENT = -2;
const ALIGN_PARENT_TOP = 10;
const ALIGN_PARENT_BOTTOM = 12;
const ALIGN_PARENT_LEFT = 9;
const ALIGN_PARENT_RIGHT = 11;
const CENTER_HORIZONTAL = 14;
const DIRECTORY_PICTURES = 'DIRECTORY_PICTURES';
const DIRECTORY_MOVIES = 'DIRECTORY_MOVIES';
const FOCUS_MODE_AUTO = 'auto';
const FOCUS_MODE_EDOF = 'edof';
const FOCUS_MODE_CONTINUOUS_PICTURE = 'continuous-picture';
const FOCUS_MODE_CONTINUOUS_VIDEO = 'continuous-video';
const FLASH_MODE_ON = 'on';
const FLASH_MODE_OFF = 'off';
const CAMERA_FACING_FRONT = 1; // front camera
const CAMERA_FACING_BACK = 0; // rear camera
const RESULT_CODE_PICKER_IMAGES = 941;
const RESULT_OK = -1;
// AndroidX support

// Snapshot-friendly functions
const CAMERA = () => android.Manifest.permission.CAMERA;
const RECORD_AUDIO = () => android.Manifest.permission.RECORD_AUDIO;
const READ_EXTERNAL_STORAGE = () => android.Manifest.permission.READ_EXTERNAL_STORAGE;
const WRITE_EXTERNAL_STORAGE = () => android.Manifest.permission.WRITE_EXTERNAL_STORAGE;

// Since these device.* properties resolve directly to the android.* namespace,
// the snapshot will fail if they resolve during import, so must be done via a function
const DEVICE_INFO_STRING = () => `Device: ${Device.manufacturer} ${Device.model} on SDK: ${Device.sdkVersion}`;

export class CameraPlus extends CameraPlusBase {
  // @GetSetProperty() public camera: android.hardware.Camera;
  // Snapshot-friendly, since the decorator will include the snapshot-unknown object "android"
  private _camera: com.github.triniwiz.fancycamera.FancyCamera;
  private _cameraId;

  @GetSetProperty()
  public flashOnIcon: string = 'ic_flash_on_white';
  @GetSetProperty()
  public flashOffIcon: string = 'ic_flash_off_white';
  @GetSetProperty()
  public toggleCameraIcon: string = 'ic_switch_camera_white';
  @GetSetProperty()
  public confirmPhotos: boolean = true;
  @GetSetProperty()
  public saveToGallery: boolean = false;
  @GetSetProperty()
  public takePicIcon: string = 'ic_camera_white';
  @GetSetProperty()
  public galleryIcon: string = 'ic_photo_library_white';
  @GetSetProperty()
  public insetButtons: boolean = false;
  @GetSetProperty()
  public insetButtonsPercent: number = 0.1;
  @GetSetProperty()
  public enableVideo: boolean;
  @GetSetProperty()
  public isRecording: boolean;
  public events: ICameraPlusEvents;
  private _nativeView: android.widget.RelativeLayout;
  private _owner: WeakRef<any>;
  private _mediaRecorder: android.media.MediaRecorder;
  private _textureSurface: android.view.Surface;
  private _textureView: android.view.TextureView;
  private _surface: android.graphics.SurfaceTexture; // reference to surface to ensure toggling the camera works correctly
  private _flashBtn: android.widget.ImageButton = null; // reference to native flash button
  private _takePicBtn: android.widget.ImageButton = null; // reference to native take picture button
  private _toggleCamBtn: android.widget.ImageButton = null; // reference to native toggle camera button
  private _galleryBtn: android.widget.ImageButton = null; // reference to native open gallery button
  private _videoOptions: IVideoOptions;
  private _videoPath: string;
  readonly _context; // defining this to pass TS warning, NS provides the context during lifecycle
  _lastCameraOptions: ICameraOptions[];
  constructor() {
    super();
    this._camera = null;

    this._textureSurface = null;

    this.flashOnIcon = this.flashOnIcon ? this.flashOnIcon : 'ic_flash_on_white';

    this.flashOffIcon = this.flashOffIcon ? this.flashOffIcon : 'ic_flash_off_white';

    this.toggleCameraIcon = this.toggleCameraIcon ? this.toggleCameraIcon : 'ic_switch_camera_white';

    this.takePicIcon = this.takePicIcon ? this.takePicIcon : 'ic_camera_alt_white';

    this.galleryIcon = this.galleryIcon ? this.galleryIcon : 'ic_photo_library_white';

    this.cameraId = CameraPlus.defaultCamera === 'front' ? CAMERA_FACING_FRONT : CAMERA_FACING_BACK;

    this._onLayoutChangeListener = this._onLayoutChangeFn.bind(this);

    this._permissionListener = this._permissionListenerFn.bind(this);
    this._lastCameraOptions = [];
  }

  private isVideoEnabled() {
    return this.enableVideo === true || CameraPlus.enableVideo;
  }

  get ratio() {
    return this._camera ? this._camera.getRatio() : '4:3';
  }

  set ratio(value: string) {
    if (this._camera) {
      this._camera.setRatio(value);
    }
  }

  get zoom() {
    return this._camera ? this._camera.getZoom() : 0;
  }

  set zoom(value: number) {
    if (this._camera) {
      this._camera.setZoom(value);
    }
  }

  // @ts-ignore
  set whiteBalance(value: WhiteBalance | string) {
    if (this._camera) {
      switch (value) {
        case WhiteBalance.Cloudy:
          this._camera.setWhiteBalance(
            com.github.triniwiz.fancycamera.WhiteBalance.Cloudy
          );
          break;
        case WhiteBalance.Fluorescent:
          this._camera.setWhiteBalance(
            com.github.triniwiz.fancycamera.WhiteBalance.Fluorescent
          );
          break;
        case WhiteBalance.Incandescent:
          this._camera.setWhiteBalance(
            com.github.triniwiz.fancycamera.WhiteBalance.Incandescent
          );
          break;
        case WhiteBalance.Shadow:
          this._camera.setWhiteBalance(
            com.github.triniwiz.fancycamera.WhiteBalance.Shadow
          );
          break;
        case WhiteBalance.Sunny:
          this._camera.setWhiteBalance(
            com.github.triniwiz.fancycamera.WhiteBalance.Sunny
          );
          break;
        case WhiteBalance.Twilight:
          this._camera.setWhiteBalance(
            com.github.triniwiz.fancycamera.WhiteBalance.Twilight
          );
          break;
        case WhiteBalance.WarmFluorescent:
          this._camera.setWhiteBalance(
            com.github.triniwiz.fancycamera.WhiteBalance.WarmFluorescent
          );
          break;
        default:
          this._camera.setWhiteBalance(
            com.github.triniwiz.fancycamera.WhiteBalance.Auto
          );
          break;
      }
    }
  }

  get whiteBalance(): WhiteBalance | string {
    if (this._camera) {
      switch (this._camera.getWhiteBalance()) {
        case com.github.triniwiz.fancycamera.WhiteBalance.Cloudy:
          return WhiteBalance.Cloudy;
        case com.github.triniwiz.fancycamera.WhiteBalance.Fluorescent:
          return WhiteBalance.Fluorescent;
        case com.github.triniwiz.fancycamera.WhiteBalance.Incandescent:
          return WhiteBalance.Incandescent;
        case com.github.triniwiz.fancycamera.WhiteBalance.Shadow:
          return WhiteBalance.Shadow;
        case com.github.triniwiz.fancycamera.WhiteBalance.Sunny:
          return WhiteBalance.Sunny;
        case com.github.triniwiz.fancycamera.WhiteBalance.Twilight:
          return WhiteBalance.Twilight;
        case com.github.triniwiz.fancycamera.WhiteBalance.WarmFluorescent:
          return WhiteBalance.WarmFluorescent;
        default:
          return WhiteBalance.Auto;
      }
    }
    return WhiteBalance.Auto;
  }

  getAvailablePictureSizes(ratio: string): { width: number, height: number }[] {
    const sizes = [];
    if (this._camera && typeof ratio === 'string') {
      const nativeSizes: any = this._camera.getAvailablePictureSizes(ratio);
      for (const size of nativeSizes) {
        sizes.push({ width: size.getWidth(), height: size.getHeight() });
      }
    }
    return sizes;
  }

  getGetSupportedRatios(): string[] {
    const ratios = [];
    if (this._camera) {
      const nativeRatios: any = this._camera.getGetSupportedRatios();
      for (const ratio of nativeRatios) {
        ratios.push(ratio);
      }
    }
    return ratios;
  }

  // @ts-ignore
  set pictureSize(value: string) {
    if (this._camera) {
      this._camera.setPictureSize(value);
    }
  }

  get pictureSize(): string {
    return this._camera ? this._camera.getPictureSize() : '0x0';
  }

  get camera() {
    return this._camera;
  }
  /**
   * Create the native view
   */
  public createNativeView() {
    // create the Android RelativeLayout
    Application.android.on('activityRequestPermissions', this._permissionListener);
    this._nativeView = new android.widget.RelativeLayout(this._context);
    this._camera = new com.github.triniwiz.fancycamera.FancyCamera(this._context);
    (this._camera as any).setLayoutParams(
      new android.view.ViewGroup.LayoutParams(
        android.view.ViewGroup.LayoutParams.MATCH_PARENT,
        android.view.ViewGroup.LayoutParams.MATCH_PARENT
      )
    );

    this._nativeView.addView(this._camera as any);
    return this._nativeView;
  }

  private _onLayoutChangeFn(args) {
    const size = this.getActualSize();
    CLog('xml width/height:', size.width + 'x' + size.height);
    this._initDefaultButtons();
  }

  private _onLayoutChangeListener: any;

  private _permissionListener: any;

  private _permissionListenerFn(args) {
    if (this._camera) {
      CLog('', this._camera.hasCameraPermission() || this._camera.hasPermission());
      if (this._camera.hasCameraPermission() || this._camera.hasPermission()) {
        this._camera.startPreview();
      }
    }
  }

  public initNativeView() {
    super.initNativeView();
    this.on(View.layoutChangedEvent, this._onLayoutChangeListener);
    const listenerImpl = (com as any).github.triniwiz.fancycamera.CameraEventListenerUI.extend({
      owner: null,
      onReady(): void { },
      onCameraCloseUI(): void {
      },
      onCameraError(message: string, ex: java.lang.Exception): void {
        console.log('onCameraError', message);
        ex.printStackTrace();
        const owner = this.owner ? this.owner.get() : null;
        if (owner) {
          owner._lastCameraOptions.shift();
          CLog(message, null);
          owner.sendEvent(CameraPlus.errorEvent, null, message);
          if (owner.isRecording) {
            owner.isRecording = false;
          }
        }
      },
      async onCameraPhotoUI(event?: java.io.File) {
        const owner = this.owner ? this.owner.get() : null;
        const file = event;
        const options = owner._lastCameraOptions.shift();
        let confirmPic;
        let confirmPicRetakeText;
        let confirmPicSaveText;
        let saveToGallery;
        let reqWidth;
        let reqHeight;
        let shouldKeepAspectRatio;
        let shouldAutoSquareCrop = owner.autoSquareCrop;

        const density = Utils.layout.getDisplayDensity();
        if (options) {
          confirmPic = options.confirm ? true : false;
          confirmPicRetakeText = options.confirmRetakeText ? options.confirmRetakeText : owner.confirmRetakeText;
          confirmPicSaveText = options.confirmSaveText ? options.confirmSaveText : owner.confirmSaveText;
          saveToGallery = options.saveToGallery ? true : false;
          reqWidth = options.width ? options.width * density : 0;
          reqHeight = options.height ? options.height * density : reqWidth;
          shouldKeepAspectRatio = Utils.isNullOrUndefined(options.keepAspectRatio) ? true : options.keepAspectRatio;
          shouldAutoSquareCrop = !!options.autoSquareCrop;
        } else {
          // use xml property getters or their defaults
          CLog('Using property getters for defaults, no options.');
          confirmPic = owner.confirmPhotos;
          saveToGallery = owner.saveToGallery;
        }
        if (confirmPic === true) {
          owner.sendEvent(CameraPlus.confirmScreenShownEvent);
          const result = await CamHelpers.createImageConfirmationDialog(
            file.getAbsolutePath(),
            confirmPicRetakeText,
            confirmPicSaveText
          ).catch((ex) => {
            CLog('Error createImageConfirmationDialog', ex);
          });

          owner.sendEvent(CameraPlus.confirmScreenDismissedEvent);

          CLog(`confirmation result = ${result}`);
          if (result !== true) {
            file.delete();
            return;
          }

          const asset = CamHelpers.assetFromPath(
            file.getAbsolutePath(),
            reqWidth,
            reqHeight,
            shouldKeepAspectRatio
          );

          owner.sendEvent(CameraPlus.photoCapturedEvent, asset);
          return;
        } else {
          const asset = CamHelpers.assetFromPath(
            file.getAbsolutePath(),
            reqWidth,
            reqHeight,
            shouldKeepAspectRatio
          );
          owner.sendEvent(CameraPlus.photoCapturedEvent, asset);
          return;
        }
      },
      onCameraOpenUI(): void {
        const owner = this.owner ? this.owner.get() : null;
        if (owner) {
          owner._initDefaultButtons();
          if (owner._togglingCamera) {
            owner.sendEvent(CameraPlus.toggleCameraEvent, owner.camera);
            owner._ensureCorrectFlashIcon();
            owner._togglingCamera = true;
          } else {
            owner.sendEvent('loaded', owner.camera);
          }
        }
      },
      onCameraVideoStartUI(): void {
        const owner = this.owner ? this.owner.get() : null;
        if (owner) {
          owner.isRecording = true;
          owner.sendEvent(CameraPlus.videoRecordingStartedEvent, owner.camera);
        }
      },
      onCameraVideoUI(event?: java.io.File): void {
        const owner = this.owner ? this.owner.get() : null;
        if (owner) {
          owner.sendEvent(CameraPlus.videoRecordingReadyEvent, event.getAbsolutePath());
          CLog(`Recording complete`);
          owner.isRecording = false;
        }
      },
      onCameraAnalysisUI(imageAnalysis: com.github.triniwiz.fancycamera.ImageAnalysis): void {
      },
    });
    const listener = new listenerImpl();
    listener.owner = new WeakRef(this);
    this._camera.setListener(listener);
    this.cameraId = this._cameraId;
  }

  disposeNativeView() {
    CLog('disposeNativeView.');
    this.off(View.layoutChangedEvent, this._onLayoutChangeListener);
    Application.android.off('activityRequestPermissions', this._permissionListener);
    this.releaseCamera();
    super.disposeNativeView();
  }

  get cameraId() {
    return this._cameraId;
  }

  set cameraId(id: any) {
    if (this._camera) {
      switch (id) {
        case CAMERA_FACING_FRONT:
          this._camera.setPosition(com.github.triniwiz.fancycamera.CameraPosition.FRONT);
          this._cameraId = CAMERA_FACING_FRONT;
          break;
        default:
          this._camera.setPosition(com.github.triniwiz.fancycamera.CameraPosition.BACK);
          this._cameraId = CAMERA_FACING_BACK;
          break;
      }
    }
    this._cameraId = id;
  }
  /**
   * Takes a picture with from the camera preview.
   */
  public takePicture(options?: ICameraOptions): void {
    if (this._camera) {
      options = options || {};
      CLog(JSON.stringify(options));

      const hasCamPerm = this.hasCameraPermission();
      if (!hasCamPerm) {
        CLog('Application does not have permission to use Camera.');
        return;
      }

      if (!!options.useCameraOptions && typeof options.width === 'number' && typeof options.height === 'number') {
        (this._camera as any).setOverridePhotoWidth(options.width);
        (this._camera as any).setOverridePhotoHeight(options.height);
      }

      this._camera.setSaveToGallery(!!options.saveToGallery);
      this._camera.setAutoSquareCrop(!!options.autoSquareCrop);
      this._lastCameraOptions.push(options);
      this._camera.takePhoto();
    }
  }

  private releaseCamera() {
    if (this._camera) {
      this._camera.release();
    }
  }

  // @ts-ignore
  public get autoFocus(): boolean {
    return this._camera ? this._camera.getAutoFocus() : false;
  }

  public set autoFocus(focus: boolean) {
    if (this._camera) {
      this._camera.setAutoFocus(focus);
    }
  }

  _togglingCamera = false;
  /**
   * Toggle the opened camera. Only supported on devices with multiple cameras.
   */
  public toggleCamera() {
    if (this._camera) {
      this._togglingCamera = true;
      this._camera.toggleCamera();

      const camNumber = this.getNumberOfCameras();
      if (camNumber <= 1) {
        CLog(`Android Device has ${camNumber} camera.`);
        return;
      }

      this.sendEvent(CameraPlus.toggleCameraEvent, this.camera);

      // need to check flash mode when toggling...
      // front cam may not have flash - and just ensure the correct icon shows
      this._ensureCorrectFlashIcon();
      // try to set focus mode when camera gets toggled
      this._ensureFocusMode();
    }
  }

  public async record(options?: IVideoOptions) {
    options = options || {};
    if (this._camera) {
      this._camera.setDisableHEVC(!!options.disableHEVC);
      this._camera.setSaveToGallery(!!options.saveToGallery);
      switch (options.quality) {
        case CameraVideoQuality.HIGHEST:
          this._camera.setQuality(com.github.triniwiz.fancycamera.Quality.HIGHEST);
          break;
        case CameraVideoQuality.LOWEST:
          this._camera.setQuality(com.github.triniwiz.fancycamera.Quality.LOWEST);
          break;
        case CameraVideoQuality.MAX_2160P:
          this._camera.setQuality(com.github.triniwiz.fancycamera.Quality.MAX_2160P);
          break;
        case CameraVideoQuality.MAX_1080P:
          this._camera.setQuality(com.github.triniwiz.fancycamera.Quality.MAX_1080P);
          break;
        case CameraVideoQuality.MAX_720P:
          this._camera.setQuality(com.github.triniwiz.fancycamera.Quality.MAX_720P);
          break;
        case CameraVideoQuality.QVGA:
          this._camera.setQuality(com.github.triniwiz.fancycamera.Quality.QVGA);
          break;
        default:
          this._camera.setQuality(com.github.triniwiz.fancycamera.Quality.MAX_480P);
          break;
      }
      // -1 uses profile value;
      this._camera.setMaxAudioBitRate(options.androidMaxAudioBitRate || -1);
      this._camera.setMaxVideoBitrate(options.androidMaxVideoBitRate || -1);
      this._camera.setMaxVideoFrameRate(options.androidMaxFrameRate || -1);

      const permResult = await this.requestVideoRecordingPermissions();
      CLog(permResult);
      this._camera.startRecording();
    }
  }

  /**
   * Stop recording video
   */
  public stop(): void {
    this.stopRecording();
  }

  public stopRecording() {
    if (this._camera) {
      CLog(`*** stopping mediaRecorder ***`);
      this._camera.stopRecording();
    }
  }

  /**
   * Open the device image picker
   * @param options
   */
  public chooseFromLibrary(options?: IChooseOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const createThePickerIntent = () => {
          const intent = new android.content.Intent() as android.content.Intent;
          intent.setType('*/*');

          if (!options) {
            options = {
              showImages: true,
              showVideos: this.isVideoEnabled(),
            };
          }

          if (options.showImages === undefined) {
            options.showImages = true;
          }

          if (options.showVideos === undefined) {
            options.showVideos = true;
          }

          let length = 0;
          if (options.showImages) {
            length++;
          }

          if (options.showVideos) {
            length++;
          }

          const mimetypes = Array.create(java.lang.String, length);
          let index = 0;
          if (options.showImages) {
            mimetypes[index] = 'image/*';
            index++;
          }
          if (options.showVideos) {
            mimetypes[index] = 'video/*';
          }

          // not in platform-declaration typings
          intent.putExtra((android.content.Intent as any).EXTRA_MIME_TYPES, mimetypes);

          intent.setAction('android.intent.action.GET_CONTENT');
          // set the multiple picker mode
          if (this.galleryPickerMode === 'multiple') {
            intent.putExtra('android.intent.extra.ALLOW_MULTIPLE', true);
          }

          const onImagePickerResultEventListener = (event: AndroidActivityResultEventData) => {
            if (event.requestCode === RESULT_CODE_PICKER_IMAGES && event.resultCode === RESULT_OK) {
              try {
                const data: android.content.Intent = event.intent;
                const selectedImages = this.getSelectedImages(data);

                this.sendEvent(CameraPlus.imagesSelectedEvent, selectedImages);

                resolve(selectedImages);
              } catch (error) {
                CLog(error);
                this.sendEvent(CameraPlus.errorEvent, error, 'Error with the image picker result.');
                reject(error);
              }
            } else {
              const error = new Error(`Image picker activity result code ${event.resultCode}`);
              this.sendEvent(CameraPlus.errorEvent, error, error.message);
              reject(error);
            }

            // Cleanup, remove bound listener.
            Application.android.off(AndroidApplication.activityResultEvent, onImagePickerResultEventListener);
          };

          // Bind listener
          Application.android.on(AndroidApplication.activityResultEvent, onImagePickerResultEventListener);

          // Start the intent
          Application.android.foregroundActivity.startActivityForResult(intent, RESULT_CODE_PICKER_IMAGES);
        };

        // Ensure storage permissions
        if (!this.hasStoragePermissions()) {
          permissions.requestPermissions([READ_EXTERNAL_STORAGE(), WRITE_EXTERNAL_STORAGE()]).then(() => {
            if (!this.hasStoragePermissions()) {
              const error = new Error('request for storage permissions denied');
              this.sendEvent(CameraPlus.errorEvent, error, 'Error choosing an image from the device library.');
              reject(error);
            } else {
              createThePickerIntent();
            }
          });
          return;
        }

        createThePickerIntent();
      } catch (e) {
        this.sendEvent(CameraPlus.errorEvent, e, 'Error choosing an image from the device library.');
        reject(e);
      }
    });
  }

  /**
   * Collect images from intent and return a collection of Image Assets.
   *
   * @param intent
   */
  private getSelectedImages(intent: android.content.Intent): ImageAsset[] {
    const selectedImages: ImageAsset[] = [];
    const clipData = intent.getClipData();

    const imageFromUri = (uri: globalAndroid.net.Uri) => {
      const selectedAssetUri = new SelectedAsset(uri).fileUri;
      return new ImageAsset(selectedAssetUri);
    };

    if (clipData !== null) {
      for (let i = 0; i < clipData.getItemCount(); i++) {
        const clipItem = clipData.getItemAt(i);
        const uri = clipItem.getUri();
        const asset = imageFromUri(uri);
        selectedImages.push(asset);
      }
    } else {
      const uri = intent.getData();
      const asset = imageFromUri(uri);
      selectedImages.push(asset);
    }

    return selectedImages;
  }

  /**
   * Toggles the flash mode of the camera.
   */
  public toggleFlash() {
    if (this._camera) {
      if (this._camera.getFlashMode() !== com.github.triniwiz.fancycamera.CameraFlashMode.OFF) {
        this._camera.setFlashMode(com.github.triniwiz.fancycamera.CameraFlashMode.ON);
      } else {
        this._camera.setFlashMode(com.github.triniwiz.fancycamera.CameraFlashMode.OFF);
      }
    }
  }

  /**
   * Request permission to use device camera.
   * @param explanation
   */
  public requestCameraPermissions(explanation: string = ''): Promise<boolean> {
    return new Promise((resolve, reject) => {
      permissions
        .requestPermission(CAMERA(), explanation)
        .then(() => {
          resolve(true);
        })
        .catch((err) => {
          this.sendEvent(CameraPlus.errorEvent, err, 'Error requesting Camera permissions.');
          reject(false);
        });
    });
  }

  /**
   * Returns true if the CAMERA permission has been granted.
   */
  public hasCameraPermission(): boolean {
    return permissions.hasPermission(CAMERA());
  }

  /**
   * Request permission to use record audio for video.
   * @param explanation
   */
  public requestAudioPermissions(explanation: string = ''): Promise<boolean> {
    return new Promise((resolve, reject) => {
      permissions
        .requestPermission(RECORD_AUDIO(), explanation)
        .then(() => {
          resolve(true);
        })
        .catch((err) => {
          this.sendEvent(CameraPlus.errorEvent, err, 'Error requesting Audio permission.');
          reject(false);
        });
    });
  }

  /**
   * Returns true if the RECORD_AUDIO permission has been granted.
   */
  public hasAudioPermission(): boolean {
    return permissions.hasPermission(RECORD_AUDIO());
  }

  /**
   * Request permission to read/write to external storage.
   * @param explanation
   */
  public requestStoragePermissions(explanation: string = ''): Promise<boolean> {
    return new Promise((resolve, reject) => {
      permissions
        .requestPermissions([WRITE_EXTERNAL_STORAGE(), READ_EXTERNAL_STORAGE()], explanation)
        .then(() => {
          resolve(true);
        })
        .catch((err) => {
          this.sendEvent(CameraPlus.errorEvent, err, 'Error requesting Storage permissions.');
          reject(false);
        });
    });
  }

  /**
   * Returns true if the WRITE_EXTERNAL_STORAGE && READ_EXTERNAL_STORAGE permissions have been granted.
   */
  public hasStoragePermissions(): boolean {
    const writePerm = permissions.hasPermission(WRITE_EXTERNAL_STORAGE());
    const readPerm = permissions.hasPermission(READ_EXTERNAL_STORAGE());
    if (writePerm === true && readPerm === true) {
      return true;
    } else {
      return false;
    }
  }

  public requestVideoRecordingPermissions(explanation: string = ''): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      permissions
        .requestPermissions([WRITE_EXTERNAL_STORAGE(), RECORD_AUDIO()], explanation)
        .then(() => {
          resolve(true);
        })
        .catch((err) => {
          this.sendEvent(CameraPlus.errorEvent, err, 'Error requesting Video permissions.');
          reject(false);
        });
    });
  }

  public hasVideoRecordingPermissions() {
    const writePerm = permissions.hasPermission(WRITE_EXTERNAL_STORAGE());
    const audio = permissions.hasPermission(RECORD_AUDIO());
    if (writePerm === true && audio === true) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Gets current camera selection
   */
  public getCurrentCamera(): 'front' | 'rear' {
    if (!this._camera) return 'rear';
    switch (this._camera.getPosition()) {
      case com.github.triniwiz.fancycamera.CameraPosition.FRONT:
        return 'front';
      default:
        return 'rear';
    }
  }

  /**
   * Check if the device has a camera
   */
  public isCameraAvailable() {
    if (
      Utils.ad
        .getApplicationContext()
        .getPackageManager()
        .hasSystemFeature('android.hardware.camera')
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Returns number of cameras on device
   */
  public getNumberOfCameras(): number {
    if (!this._camera) return 0;
    return this._camera.getNumberOfCameras();
  }

  /**
   * Check if device has flash modes
   * @param camera
   */
  public hasFlash() {
    if (!this._camera) {
      return false;
    }
    return this._camera.getHasFlash();
  }

  /**
   * Return the current flash mode of the device. Will return null if the flash mode is not supported by device.
   */
  public getFlashMode() {
    if (this.hasFlash()) {
      if (this._camera.getFlashMode() !== com.github.triniwiz.fancycamera.CameraFlashMode.OFF) {
        return 'on';
      }
      return 'off';
    }
    return null;
  }

  /**
   * Helper method to ensure the correct icon (on/off) is shown on flash.
   * Useful when toggling cameras.
   */
  _ensureCorrectFlashIcon() {
    // get current flash mode and set correct image drawable
    const currentFlashMode = this.getFlashMode();
    CLog('_ensureCorrectFlashIcon flash mode', currentFlashMode);

    // if the flash mode is null then we need to remove the button from the parent layout
    if (currentFlashMode === null) {
      // if we have the button - remove it from parent
      if (this._flashBtn) {
        this._flashBtn.setVisibility(android.view.View.GONE);
      }
      return;
    }

    // ensure flashBtn is here - if currentFlashMode is null then don't show/assign the flash button
    if (this._flashBtn === undefined || this._flashBtn === null) {
      return;
    }

    // make sure we have our flash icon button visible - sometimes toggling might set to GONE
    this._flashBtn.setVisibility(android.view.View.VISIBLE);

    // reset the image in the button first
    this._flashBtn.setImageResource((android as any).R.color.transparent);

    const flashIcon = currentFlashMode === FLASH_MODE_OFF ? this.flashOffIcon : this.flashOnIcon;
    const imageDrawable = CamHelpers.getImageDrawable(flashIcon);
    this._flashBtn.setImageResource(imageDrawable);
  }

  private _ensureFocusMode() {
    // setup autoFocus if possible
  }

  private _initFlashButton() {
    this._flashBtn = CamHelpers.createImageButton();
    // set correct flash icon on button
    this._ensureCorrectFlashIcon();
    const shape = CamHelpers.createTransparentCircleDrawable();
    this._flashBtn.setBackgroundDrawable(shape);
    const ref = new WeakRef(this);
    this._flashBtn.setOnClickListener(
      new android.view.View.OnClickListener({
        onClick: (args) => {
          const owner = ref.get();
          if (owner) {
            owner.toggleFlash();
            owner._ensureCorrectFlashIcon();
          }
        },
      })
    );
    const flashParams = new android.widget.RelativeLayout.LayoutParams(WRAP_CONTENT, WRAP_CONTENT);
    if (this.insetButtons === true) {
      // need to get the width of the screen
      const layoutWidth = this._nativeView.getWidth();
      CLog(`layoutWidth = ${layoutWidth}`);
      const xMargin = layoutWidth * this.insetButtonsPercent;
      const layoutHeight = this._nativeView.getHeight();
      CLog(`layoutHeight = ${layoutHeight}`);
      const yMargin = layoutHeight * this.insetButtonsPercent;
      // add margin to left and top where the button is positioned
      flashParams.setMargins(xMargin, yMargin, 8, 8);
    } else {
      flashParams.setMargins(8, 8, 8, 8);
    }
    flashParams.addRule(ALIGN_PARENT_TOP);
    flashParams.addRule(ALIGN_PARENT_LEFT);
    this._nativeView.addView(this._flashBtn, flashParams);
  }

  private _initGalleryButton() {
    this._galleryBtn = CamHelpers.createImageButton();
    const openGalleryDrawable = CamHelpers.getImageDrawable(this.galleryIcon);
    this._galleryBtn.setImageResource(openGalleryDrawable);
    const shape = CamHelpers.createTransparentCircleDrawable();
    this._galleryBtn.setBackgroundDrawable(shape);
    const ref = new WeakRef(this);
    this._galleryBtn.setOnClickListener(
      new android.view.View.OnClickListener({
        onClick: (args) => {
          const owner = ref.get();
          if (owner) {
            owner.chooseFromLibrary();
          }
        },
      })
    );
    const galleryParams = new android.widget.RelativeLayout.LayoutParams(WRAP_CONTENT, WRAP_CONTENT);
    if (this.insetButtons === true) {
      const layoutWidth = this._nativeView.getWidth();
      CLog(`layoutWidth = ${layoutWidth}`);
      const xMargin = layoutWidth * this.insetButtonsPercent;
      const layoutHeight = this._nativeView.getHeight();
      CLog(`layoutHeight = ${layoutHeight}`);
      const yMargin = layoutHeight * this.insetButtonsPercent;
      // add margin to bottom and left where button is positioned
      galleryParams.setMargins(xMargin, 8, 8, yMargin);
    } else {
      galleryParams.setMargins(8, 8, 8, 8);
    }
    galleryParams.addRule(ALIGN_PARENT_BOTTOM);
    galleryParams.addRule(ALIGN_PARENT_LEFT);
    this._nativeView.addView(this._galleryBtn, galleryParams);
  }

  private _initToggleCameraButton() {
    this._toggleCamBtn = CamHelpers.createImageButton();
    const switchCameraDrawable = CamHelpers.getImageDrawable(this.toggleCameraIcon);
    this._toggleCamBtn.setImageResource(switchCameraDrawable);
    const shape = CamHelpers.createTransparentCircleDrawable();
    this._toggleCamBtn.setBackgroundDrawable(shape);
    const ref = new WeakRef(this);
    this._toggleCamBtn.setOnClickListener(
      new android.view.View.OnClickListener({
        onClick: (view: android.view.View) => {
          const owner = ref.get();
          if (owner) {
            owner.toggleCamera();
          }
        },
      })
    );

    const toggleCamParams = new android.widget.RelativeLayout.LayoutParams(WRAP_CONTENT, WRAP_CONTENT);
    if (this.insetButtons === true) {
      const layoutWidth = this._nativeView.getWidth();
      CLog(`layoutWidth = ${layoutWidth}`);
      const xMargin = layoutWidth * this.insetButtonsPercent;
      const layoutHeight = this._nativeView.getHeight();
      CLog(`layoutHeight = ${layoutHeight}`);
      const yMargin = layoutHeight * this.insetButtonsPercent;
      toggleCamParams.setMargins(8, yMargin, xMargin, 8);
    } else {
      toggleCamParams.setMargins(8, 8, 8, 8);
    }
    toggleCamParams.addRule(ALIGN_PARENT_TOP);
    toggleCamParams.addRule(ALIGN_PARENT_RIGHT);
    this._nativeView.addView(this._toggleCamBtn, toggleCamParams);
  }

  private _initTakePicButton() {
    this._takePicBtn = CamHelpers.createImageButton();
    const takePicDrawable = CamHelpers.getImageDrawable(this.takePicIcon);
    this._takePicBtn.setImageResource(takePicDrawable); // set the icon
    const shape = CamHelpers.createTransparentCircleDrawable();
    this._takePicBtn.setBackgroundDrawable(shape); // set the transparent background
    const ref = new WeakRef(this);
    this._takePicBtn.setOnClickListener(
      new android.view.View.OnClickListener({
        onClick: (args) => {
          CLog(`The default Take Picture event will attempt to save the image to gallery.`);
          const opts = {
            saveToGallery: true,
            confirm: this.confirmPhotos ? true : false,
            autoSquareCrop: this.autoSquareCrop,
          };
          const owner = ref.get();
          if (owner) {
            owner.takePicture(opts);
          }
        },
      })
    );
    const takePicParams = new android.widget.RelativeLayout.LayoutParams(WRAP_CONTENT, WRAP_CONTENT);
    if (this.insetButtons === true) {
      const layoutHeight = this._nativeView.getHeight();
      CLog(`layoutHeight = ${layoutHeight}`);
      const yMargin = layoutHeight * this.insetButtonsPercent;
      takePicParams.setMargins(8, 8, 8, yMargin);
    } else {
      takePicParams.setMargins(8, 8, 8, 8);
    }
    takePicParams.addRule(ALIGN_PARENT_BOTTOM);
    takePicParams.addRule(CENTER_HORIZONTAL);
    this._nativeView.addView(this._takePicBtn, takePicParams);
  }

  /**
   * Creates the default buttons depending on the options to show the various default buttons.
   */
  private _initDefaultButtons() {
    try {
      // flash button setup - if the device doesn't support flash do not setup/show this button
      if (this.showFlashIcon === true && this.getFlashMode() !== null && this._flashBtn === null) {
        this._initFlashButton();
      }

      // gallery button setup
      if (this.showGalleryIcon === true && this._galleryBtn === null) {
        this._initGalleryButton();
      }

      // camera toggle button setup
      if (this.showToggleIcon === true && this.getNumberOfCameras() > 1 && this._toggleCamBtn === null) {
        this._initToggleCameraButton();
      }

      // take picture button setup
      if (this.showCaptureIcon === true && this._takePicBtn === null) {
        if (this.showFlashIcon === true && this.getFlashMode() !== null && this._flashBtn === null) {
          this._initFlashButton();
        }

        // gallery button setup
        if (this.showGalleryIcon === true && this._galleryBtn === null) {
          this._initGalleryButton();
        }

        // camera toggle button setup
        if (this.showToggleIcon === true && this.getNumberOfCameras() > 1 && this._toggleCamBtn === null) {
          this._initToggleCameraButton();
        }

        // take picture button setup
        if (this.showCaptureIcon === true && this._takePicBtn === null) {
          this._initTakePicButton();
        }
      }
    } catch (ex) {
      CLog('_initDefaultButtons error', ex);
    }
  }
}

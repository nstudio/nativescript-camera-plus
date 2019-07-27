/**********************************************************************************
 * (c) 2017, nStudio, LLC & LiveShopper, LLC
 *
 * Version 1.1.0                                                    team@nStudio.io
 **********************************************************************************/
/// <reference path="./node_modules/tns-platform-declarations/android.d.ts" />

import * as permissions from 'nativescript-permissions';
import * as app from 'tns-core-modules/application';
import * as fs from 'tns-core-modules/file-system';
import { ImageAsset } from 'tns-core-modules/image-asset';
import { device } from 'tns-core-modules/platform';
import * as types from 'tns-core-modules/utils/types';
import * as utils from 'tns-core-modules/utils/utils';
import './async-await'; // attach global async/await for NS
import {
  CameraPlusBase,
  CLog,
  GetSetProperty,
  ICameraOptions,
  ICameraPlusEvents,
  IChooseOptions,
  IVideoOptions,
  CameraVideoQuality
} from './camera-plus.common';
import * as CamHelpers from './helpers';
console.dir(CamHelpers);
import { SelectedAsset } from './selected-asset';
import { View } from 'tns-core-modules/ui/core/view/view';
export { CameraVideoQuality } from './camera-plus.common';
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
declare var androidx: any, android: any;
// AndroidX support
const useAndroidX = function() {
  return (<any>global).androidx;
};
const FileProviderNamespace = function() {
  return useAndroidX() && (<any>global).androidx.core && (<any>global).androidx.core.content
    ? (<any>global).androidx.core.content
    : android.support.v4.content;
};

const ExifInterfaceNamespace = function() {
  return useAndroidX() && (<any>global).androidx.exifinterface && (<any>global).androidx.exifinterface.media
    ? (<any>global).androidx.exifinterface.media
    : android.support.media;
};

// Snapshot-friendly functions
const CAMERA = () => (android as any).Manifest.permission.CAMERA;
const RECORD_AUDIO = () => (android as any).Manifest.permission.RECORD_AUDIO;
const READ_EXTERNAL_STORAGE = () => (android as any).Manifest.permission.READ_EXTERNAL_STORAGE;
const WRITE_EXTERNAL_STORAGE = () => (android as any).Manifest.permission.WRITE_EXTERNAL_STORAGE;
// Since these device.* properties resolve directly to the android.* namespace,
// the snapshot will fail if they resolve during import, so must be done via a function
const DEVICE_INFO_STRING = () => `device: ${device.manufacturer} ${device.model} on SDK: ${device.sdkVersion}`;

import * as common from './camera-plus.common';

export * from './camera-plus.common';

export class CameraPlus extends CameraPlusBase {
  // @GetSetProperty() public camera: android.hardware.Camera;
  // Snapshot-friendly, since the decorator will include the snapshot-unknown object "android"
  private _camera: android.hardware.Camera;
  public get camera(): android.hardware.Camera {
    return this._camera;
  }
  public set camera(camera: android.hardware.Camera) {
    this._camera = camera;
  }
  @GetSetProperty()
  public cameraId;
  @GetSetProperty()
  public autoFocus: boolean = true;
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
  public takePicIcon: string = 'ic_camera_alt_white';
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
  private _nativeView;
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

  constructor() {
    super();
    this.camera = null;

    this._textureSurface = null;

    this.flashOnIcon = this.flashOnIcon ? this.flashOnIcon : 'ic_flash_on_white';

    this.flashOffIcon = this.flashOffIcon ? this.flashOffIcon : 'ic_flash_off_white';

    this.toggleCameraIcon = this.toggleCameraIcon ? this.toggleCameraIcon : 'ic_switch_camera_white';

    this.takePicIcon = this.takePicIcon ? this.takePicIcon : 'ic_camera_alt_white';

    this.galleryIcon = this.galleryIcon ? this.galleryIcon : 'ic_photo_library_white';

    this.cameraId = CameraPlus.defaultCamera === 'front' ? CAMERA_FACING_FRONT : CAMERA_FACING_BACK;

    this._onLayoutChangeListener = this._onLayoutChangeFn.bind(this);
  }

  private isVideoEnabled() {
    return this.enableVideo === true || CameraPlus.enableVideo;
  }

  /**
   * Create the native view
   */
  public createNativeView() {
    // create the Android RelativeLayout
    this._nativeView = new android.widget.RelativeLayout(this._context);
    try {
      // camera is not available on this android device
      if (this.isCameraAvailable() === false) {
        CLog(`No Camera on this device.`);
        return;
      }

      // might need to release the Camera when created just to be safe with life cycle events to not lock up devices
      // this._releaseCameraAndPreview();

      const that = new WeakRef(this);

      this._owner = that;

      permissions.requestPermission(CAMERA()).then(
        () => {
          // create the TextureView that will render the camera preview
          this._textureView = new android.view.TextureView(this._context);
          if (this._textureView) {
            this._textureView.setFocusable(true);
            this._textureView.setFocusableInTouchMode(true);
            this._textureView.requestFocus();
            this._nativeView.addView(this._textureView);

            // checking to see if this improves initial video recording
            // by creating the instance of mediaRecorder here - Brad
            if (this.isVideoEnabled()) {
              this._mediaRecorder = new android.media.MediaRecorder() as android.media.MediaRecorder;
              CLog(`this._mediaRecorder`, this._mediaRecorder);
            }

            // setup SurfaceTextureListener
            this._textureView.setSurfaceTextureListener(new android.view.TextureView.SurfaceTextureListener(<any>{
              get owner() {
                return that.get();
              },
              onSurfaceTextureSizeChanged: (surface, width, height) => {
                // set the camera display orientation - if you don't do this the display is not correct when device is rotated
                this._setCameraDisplayOrientation(
                  app.android.foregroundActivity,
                  this.cameraId,
                  this.camera
                  // width,
                  // height
                );
              },
              onSurfaceTextureAvailable: (surface, width, height) => {
                CLog(`*** onSurfaceTextureAvailable ***\nthis.cameraId = ${this.cameraId}`);
                this._surface = surface; // using this as a reference to toggle camera on surface
                this._textureSurface = new android.view.Surface(surface);
                const hasPerm = this.hasCameraPermission();
                if (hasPerm === true) {
                  this._initCamera(this.cameraId);
                  this._initDefaultButtons();
                } else {
                  permissions
                    .requestPermission(CAMERA())
                    .then(() => {
                      this._initCamera(this.cameraId);
                      this._initDefaultButtons();
                    })
                    .catch(err => {
                      CLog('Application does not have permission to use CAMERA.', err);
                      return;
                    });
                }
              },
              onSurfaceTextureDestroyed: surface => {
                this._releaseCameraAndPreview();
                return true;
              },
              onSurfaceTextureUpdated: surface => {
                // invoked every time there's a new Camera preview frame
              }
            }) as android.view.TextureView.SurfaceTextureListener);
          }
        },
        err => {
          CLog('Application does not have permission to use CAMERA.', err);
          return this._nativeView;
        }
      );

      CLog('video enabled:', this.isVideoEnabled());
      CLog('default camera:', CameraPlus.defaultCamera);
    } catch (ex) {
      CLog('createNativeView error', ex);
      this.sendEvent(CameraPlus.errorEvent, ex, 'Error creating the native view.');
    }
    return this._nativeView;
  }

  private _onLayoutChangeFn(args) {
    const size = this.getActualSize();
    CLog('xml width/height:', size.width + 'x' + size.height);
  }

  private _onLayoutChangeListener: any;

  initNativeView() {
    this.on(View.layoutChangedEvent, this._onLayoutChangeListener);
  }

  disposeNativeView() {
    CLog('disposeNativeView.');
    this.off(View.layoutChangedEvent, this._onLayoutChangeListener);
    super.disposeNativeView();
  }

  /**
   * Takes a picture with from the camera preview.
   */
  public takePicture(options?: ICameraOptions): void {
    try {
      CLog(JSON.stringify(options));

      // ensure camera permission
      const hasCamPerm = this.hasCameraPermission();
      if (!hasCamPerm) {
        CLog('Application does not have permission to use Camera.');
        return;
      }

      this.camera.takePicture(
        null,
        null,
        new android.hardware.Camera.PictureCallback({
          onPictureTaken: async (data, camera) => {
            if (data === null) {
              CLog(`No image data from the Camera onPictureTaken callback.`);
              return;
            }

            this._onPictureTaken(options, data);
          }
        })
      );
    } catch (e) {
      CLog('takePicture error', e);
      this.sendEvent(CameraPlus.errorEvent, e, 'Error taking picture.');
      return;
    }
  }

  private releaseCamera() {
    if (this.camera !== null) {
      this.camera.release(); // release the camera for other applications
      this.camera = null;
    }
  }

  /**
   * Toggle the opened camera. Only supported on devices with multiple cameras.
   */
  public toggleCamera() {
    try {
      const camNumber = this.getNumberOfCameras();
      if (camNumber <= 1) {
        CLog(`Android Device has ${camNumber} camera.`);
        return;
      }

      if (this.camera === null) {
        return;
      }

      if (this.camera !== null) {
        // since we have a camera instance - stopPreview and release or the app will crash
        this.camera.stopPreview();
        this.camera.release();
        this.camera = null;
      }

      // set the camera Id
      if (this.cameraId === CAMERA_FACING_FRONT) {
        this.cameraId = CAMERA_FACING_BACK;
      } else {
        this.cameraId = CAMERA_FACING_FRONT;
      }

      this.camera = android.hardware.Camera.open(this.cameraId);
      this._setCameraDisplayOrientation(app.android.foregroundActivity, this.cameraId, this.camera);
      this.camera.setPreviewTexture(this._surface);
      this.camera.startPreview();
      this.sendEvent(CameraPlus.toggleCameraEvent, this.camera);

      // need to check flash mode when toggling...
      // front cam may not have flash - and just ensure the correct icon shows
      this._ensureCorrectFlashIcon();
      // try to set focus mode when camera gets toggled
      this._ensureFocusMode();
    } catch (ex) {
      CLog(ex);
      this.sendEvent(CameraPlus.errorEvent, ex, 'Error trying to toggle camera.');
    }
  }

  public async record(options?: IVideoOptions) {
    try {
      if (this.isVideoEnabled()) {
        // handle permissions in the method - no need to make user do it
        const permResult = await this.requestVideoRecordingPermissions();

        CLog(permResult);
        if (this.isRecording) {
          CLog('CameraPlus stop video recording.');
          this.stopRecording();
        } else {
          CLog('CameraPlus record video options:', options);
          if (options) {
            this._videoOptions = options;
          } else {
            this._videoOptions = {
              confirm: this._owner.get().confirmVideo, // from property setter
              saveToGallery: this._owner.get().saveToGallery
            };
          }

          this._prepareVideoRecorder(this._videoOptions);
        }
      }
    } catch (err) {
      CLog(err);
      this.sendEvent(CameraPlus.errorEvent, err, 'Error trying to record video.');
    }
  }

  /**
   * Stop recording video
   */
  public stop(): void {
    if (this.isVideoEnabled()) {
      this.stopRecording();
    }
  }

  public stopRecording() {
    try {
      if (this.camera && this._mediaRecorder && this.isRecording) {
        CLog(`*** stopping mediaRecorder ***`);
        this._owner.get().sendEvent(CameraPlus.videoRecordingReadyEvent, this._videoPath);
        this._mediaRecorder.stop(); // stop the recording
        this._releaseMediaRecorder(); // release the MediaRecorder object
        // inform the user that recording has stopped
        CLog(`Recording complete`);
        this.isRecording = false;
      }
    } catch (err) {
      CLog(`stopRecording error`, err);
      this.sendEvent(CameraPlus.errorEvent, err, 'Error trying to stop recording.');
      this._releaseMediaRecorder();
      this.isRecording = false;
    }
  }

  private _getCamcorderProfile(cameraId: number, quality: CameraVideoQuality): CameraVideoQuality {
    const CamcorderProfile = android.media.CamcorderProfile;
    let profile;
    switch (quality) {
      case CameraVideoQuality.MAX_720P:
        if (CamcorderProfile.hasProfile(cameraId, CamcorderProfile.QUALITY_720P)) {
          profile = CameraVideoQuality.MAX_720P;
        } else {
          profile = this._getCamcorderProfile(cameraId, CameraVideoQuality.MAX_480P);
        }
        break;
      case CameraVideoQuality.MAX_1080P:
        if (CamcorderProfile.hasProfile(cameraId, CamcorderProfile.QUALITY_1080P)) {
          profile = CameraVideoQuality.MAX_1080P;
        } else {
          profile = this._getCamcorderProfile(cameraId, CameraVideoQuality.MAX_720P);
        }

        break;
      case CameraVideoQuality.MAX_2160P:
        try {
          CamcorderProfile.get((CamcorderProfile as any).QUALITY_2160P);
          profile = CameraVideoQuality.MAX_2160P;
        } catch (e) {
          profile = CameraVideoQuality.HIGHEST;
        }
        break;
      case CameraVideoQuality.HIGHEST:
        profile = CameraVideoQuality.HIGHEST;
        break;
      case CameraVideoQuality.LOWEST:
        profile = CameraVideoQuality.LOWEST;
        break;
      case CameraVideoQuality.QVGA:
        if (CamcorderProfile.hasProfile(cameraId, CamcorderProfile.QUALITY_QVGA)) {
          profile = CameraVideoQuality.QVGA;
        } else {
          profile = CameraVideoQuality.LOWEST;
        }
        break;
      default:
        if (CamcorderProfile.hasProfile(cameraId, CamcorderProfile.QUALITY_480P)) {
          profile = CameraVideoQuality.MAX_480P;
        } else {
          profile = this._getCamcorderProfile(cameraId, CameraVideoQuality.QVGA);
        }
        break;
    }
    return profile;
  }

  private _prepareVideoRecorder(options?: IVideoOptions) {
    if (!this._mediaRecorder) {
      this._mediaRecorder = new android.media.MediaRecorder() as android.media.MediaRecorder;
      CLog(`this._mediaRecorder`, this._mediaRecorder);
    }

    // Step 1: Unlock and set camera to MediaRecorder
    this.camera.unlock();
    this._mediaRecorder.setCamera(this.camera);

    // Step 2: Set sources
    this._mediaRecorder.setAudioSource(android.media.MediaRecorder.AudioSource.CAMCORDER);
    this._mediaRecorder.setVideoSource(android.media.MediaRecorder.VideoSource.CAMERA);
    // Step 3: Set a CamcorderProfile (requires API Level 8 or higher)
    let quality;
    const cameraQuality = this._getCamcorderProfile(this.cameraId, options.quality);
    switch (cameraQuality) {
      case CameraVideoQuality.MAX_2160P:
        quality = android.media.CamcorderProfile.get(
          this.cameraId,
          (android as any).media.CamcorderProfile.QUALITY_2160P
        );
        break;
      case CameraVideoQuality.MAX_1080P:
        quality = android.media.CamcorderProfile.get(this.cameraId, android.media.CamcorderProfile.QUALITY_1080P);
        break;
      case CameraVideoQuality.MAX_720P:
        quality = android.media.CamcorderProfile.get(this.cameraId, android.media.CamcorderProfile.QUALITY_720P);
        break;
      case CameraVideoQuality.HIGHEST:
        quality = android.media.CamcorderProfile.get(this.cameraId, android.media.CamcorderProfile.QUALITY_HIGH);
        break;
      case CameraVideoQuality.LOWEST:
        quality = android.media.CamcorderProfile.get(this.cameraId, android.media.CamcorderProfile.QUALITY_LOW);
        break;
      case CameraVideoQuality.QVGA:
        quality = android.media.CamcorderProfile.get(this.cameraId, android.media.CamcorderProfile.QUALITY_QVGA);
        break;
      default:
        quality = android.media.CamcorderProfile.get(this.cameraId, android.media.CamcorderProfile.QUALITY_480P);
        break;
    }
    this._mediaRecorder.setOutputFormat(android.media.MediaRecorder.OutputFormat.MPEG_4);
    this._mediaRecorder.setVideoSize(quality.videoFrameWidth, quality.videoFrameHeight);
    this._mediaRecorder.setAudioChannels(quality.audioChannels);
    const isHevcSupported = !options.disableHEVC && android.os.Build.VERSION.SDK_INT >= 24;
    const videoBitRate = isHevcSupported ? quality.videoBitRate / 2 : quality.videoBitRate; // Use half bit rate for hevc
    this._mediaRecorder.setVideoFrameRate(quality.videoFrameRate);
    this._mediaRecorder.setVideoEncodingBitRate(videoBitRate);
    this._mediaRecorder.setAudioEncodingBitRate(quality.audioBitRate);
    if (isHevcSupported) {
      this._mediaRecorder.setVideoEncoder((android as any).media.MediaRecorder.VideoEncoder.HEVC);
    } else {
      this._mediaRecorder.setVideoEncoder(android.media.MediaRecorder.VideoEncoder.H264);
    }
    this._mediaRecorder.setAudioEncoder(quality.audioCodec);
    // Step 4: Set output file
    const videoPath = this._getOutputMediaFile(2).toString();
    this._videoPath = videoPath;
    CLog(`this._videoPath is ${this._videoPath}`);
    this._mediaRecorder.setOutputFile(videoPath);
    // Step 5: Set the preview output
    this._mediaRecorder.setPreviewDisplay(this._textureSurface);
    // setting error listener to broadcast error event
    this._mediaRecorder.setOnErrorListener(
      new android.media.MediaRecorder.OnErrorListener({
        onError: (mr: android.media.MediaRecorder, what: number, extra: number) => {
          this.sendEvent(CameraPlus.errorEvent, what, 'MediaRecorder error listener.');
          this._releaseMediaRecorder();
        }
      })
    );

    // Step 6: Prepare configured MediaRecorder
    try {
      this._mediaRecorder.prepare();
      this._mediaRecorder.start();
      this.isRecording = true;
      this._owner.get().sendEvent(CameraPlus.videoRecordingStartedEvent, this.camera);
    } catch (e) {
      CLog('Exception preparing MediaRecorder', e);
      this._releaseMediaRecorder();
      this.isRecording = false;
    }
  }

  /** Create a File for saving */
  private _getOutputMediaFile(type: number): java.io.File {
    const dateStamp = CamHelpers.createDateTimeStamp();
    let videoPath: string;
    let nativeFile: java.io.File;
    let fileName: string;
    if (this._videoOptions.saveToGallery === true) {
      // need to make sure we have STORAGE permission
      const hasStoragePerm = this.hasStoragePermissions();
      if (!hasStoragePerm) {
        CLog(`Application does not have storage permission to save file.`);
        return null;
      }

      fileName = `VID_${Date.now()}.mp4`;

      const folderPath =
        android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DCIM).toString() +
        '/Camera/';
      if (!fs.Folder.exists(folderPath)) {
        fs.Folder.fromPath(folderPath);
      }
      videoPath = fs.path.join(folderPath, fileName);

      // videoPath =
      //   android.os.Environment
      //     .getExternalStoragePublicDirectory(
      //       android.os.Environment.DIRECTORY_DCIM
      //     )
      //     .getAbsolutePath() +
      //   "/Camera/" +
      //   fileName;
      nativeFile = new java.io.File(videoPath);
    } else {
      fileName = `VID_${Date.now()}.mp4`;
      const sdkVersionInt = parseInt(device.sdkVersion);
      if (sdkVersionInt > 21) {
        const folderPath = utils.ad
          .getApplicationContext()
          .getExternalFilesDir(null)
          .getAbsolutePath();
        if (!fs.Folder.exists(folderPath)) {
          fs.Folder.fromPath(folderPath);
        }
        videoPath = fs.path.join(folderPath, fileName);

        // videoPath =
        //   android.os.Environment
        //     .getExternalStoragePublicDirectory(
        //       android.os.Environment.DIRECTORY_DCIM
        //     )
        //     .getAbsolutePath() +
        //   "/Camera/" +
        //   fileName;
        nativeFile = new java.io.File(videoPath);
        const FileProvider = FileProviderNamespace().FileProvider;
        const tempPictureUri = FileProvider.getUriForFile(
          app.android.context,
          app.android.nativeApp.getPackageName() + '.provider',
          nativeFile
        );
      } else {
        const folderPath = utils.ad
          .getApplicationContext()
          .getExternalFilesDir(null)
          .getAbsolutePath();
        if (!fs.Folder.exists(folderPath)) {
          fs.Folder.fromPath(folderPath);
        }
        videoPath = fs.path.join(folderPath, fileName);

        // videoPath =
        //   android.os.Environment
        //     .getExternalStoragePublicDirectory(
        //       android.os.Environment.DIRECTORY_DCIM
        //     )
        //     .getAbsolutePath() +
        //   "/Camera/" +
        //   fileName;
        nativeFile = new java.io.File(videoPath);
      }
    }

    CLog(`videoPath = ${videoPath}`);
    CLog(`nativeFile = ${nativeFile}`);
    CLog(`returning nativeFile = ${nativeFile}`);
    return nativeFile;
  }

  private _releaseMediaRecorder() {
    if (this._mediaRecorder) {
      this._mediaRecorder.reset(); // clear recorder configuration
      this._mediaRecorder.release(); // release the recorder object
      this._mediaRecorder = null;
      this._videoPath = ''; // reset the video path we will return when a video is done recording
      this.camera.lock(); // lock camera for later use
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
              showVideos: this.isVideoEnabled()
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

          // activityResult event
          const onImagePickerResult = args => {
            if (args.requestCode === RESULT_CODE_PICKER_IMAGES && args.resultCode === RESULT_OK) {
              try {
                const selectedImages = [];
                const data = args.intent;
                const clipData = data.getClipData();

                if (clipData !== null) {
                  for (let i = 0; i < clipData.getItemCount(); i++) {
                    const clipItem = clipData.getItemAt(i);
                    const uri = clipItem.getUri();
                    const selectedAsset = new SelectedAsset(uri);
                    const asset = new ImageAsset(selectedAsset.android);
                    selectedImages.push(asset);
                  }
                } else {
                  const uri = data.getData();
                  const path = uri.getPath();
                  const selectedAsset = new SelectedAsset(uri);
                  const asset = new ImageAsset(selectedAsset.android);
                  selectedImages.push(asset);
                }

                app.android.off(app.AndroidApplication.activityResultEvent, onImagePickerResult);
                resolve(selectedImages);
                this.sendEvent(CameraPlus.imagesSelectedEvent, selectedImages);
                return; // yay
              } catch (e) {
                CLog(e);
                app.android.off(app.AndroidApplication.activityResultEvent, onImagePickerResult);
                reject(e);
                this.sendEvent(CameraPlus.errorEvent, e, 'Error with the image picker result.');
                return;
              }
            } else {
              app.android.off(app.AndroidApplication.activityResultEvent, onImagePickerResult);
              reject(`Image picker activity result code ${args.resultCode}`);
              return;
            }
          };

          // set the onImagePickerResult for the intent
          app.android.on(app.AndroidApplication.activityResultEvent, onImagePickerResult);
          // start the intent
          app.android.foregroundActivity.startActivityForResult(intent, RESULT_CODE_PICKER_IMAGES);
        };

        // Ensure storage permissions
        const hasPerm = this.hasStoragePermissions();
        if (hasPerm === true) {
          createThePickerIntent();
        } else {
          permissions.requestPermissions([READ_EXTERNAL_STORAGE(), WRITE_EXTERNAL_STORAGE()]).then(() => {
            createThePickerIntent();
          });
        }
      } catch (e) {
        reject(e);
        this.sendEvent(CameraPlus.errorEvent, e, 'Error choosing an image from the device library.');
      }
    });
  }

  /**
   * Toggles the flash mode of the camera.
   */
  public toggleFlash() {
    try {
      if (this.camera === undefined || this.camera === null) {
        CLog(`There is no current camera to toggle flash mode`);
        return;
      }

      const params = this.camera.getParameters();
      const currentFlashMode = params.getFlashMode();
      CLog('currentFlashMode', currentFlashMode);
      // if flashmode is null then we can't do anything or errors will be thrown trying to set the mode
      if (currentFlashMode === null) {
        return;
      }

      if (currentFlashMode === FLASH_MODE_OFF || currentFlashMode === null) {
        // make sure we have the ON mode available
        params.setFlashMode(android.hardware.Camera.Parameters.FLASH_MODE_ON);
      } else if (currentFlashMode === FLASH_MODE_ON) {
        params.setFlashMode(android.hardware.Camera.Parameters.FLASH_MODE_OFF);
      }

      CLog(`setting flash mode params`);
      this.camera.setParameters(params);
      this._ensureCorrectFlashIcon();
    } catch (error) {
      CLog('toggleFlash error', error);
      this.sendEvent(CameraPlus.errorEvent, error, 'Error trying to toggle flash.');
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
        .catch(err => {
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
        .catch(err => {
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
        .catch(err => {
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
        .catch(err => {
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
    if (this.cameraId === CAMERA_FACING_FRONT) {
      return 'front';
    } else {
      return 'rear';
    }
  }

  /**
   * Check if the device has a camera
   */
  public isCameraAvailable() {
    if (
      utils.ad
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
    return android.hardware.Camera.getNumberOfCameras();
  }

  /**
   * Check if device has flash modes
   * @param camera
   */
  public hasFlash() {
    if (this.camera === null || this.camera === undefined) {
      CLog(`No camera`);
      return false;
    }

    const params = this.camera.getParameters();
    const flashModes = params.getSupportedFlashModes();
    if (flashModes === null) {
      return false;
    }

    for (let i = flashModes.size(); i--; ) {
      const item = flashModes.get(i); // string
      if ((item as any) === 'on' || (item as any) === 'auto') {
        return true;
      }
    }

    return false;
  }

  /**
   * Return the current flash mode of the device. Will return null if the flash mode is not supported by device.
   */
  public getFlashMode() {
    if (this.camera === null || this.camera === undefined) {
      CLog('no camera');
      return null;
    }

    const params = this.camera.getParameters();

    const supportedFlashModes = params.getSupportedFlashModes();
    CLog(`supported flash modes = ${supportedFlashModes} --- ${DEVICE_INFO_STRING()}`);

    const currentFlashMode = params.getFlashMode();
    return currentFlashMode;
  }

  /**
   * Helper method to ensure the correct icon (on/off) is shown on flash.
   * Useful when toggling cameras.
   */
  private _ensureCorrectFlashIcon() {
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
    if (this.autoFocus === true && this.camera) {
      const params = this.camera.getParameters();
      const supportedFocusModes = params.getSupportedFocusModes();
      CLog(`supported focus modes = ${supportedFocusModes} --- ${DEVICE_INFO_STRING()}`);
      if (supportedFocusModes.contains(android.hardware.Camera.Parameters.FOCUS_MODE_CONTINUOUS_PICTURE as any)) {
        CLog(`setting focus mode to FOCUS_MODE_CONTINUOUS_PICTURE`);
        params.setFocusMode(android.hardware.Camera.Parameters.FOCUS_MODE_CONTINUOUS_PICTURE);
        this.camera.setParameters(params);
      } else if (supportedFocusModes.contains(android.hardware.Camera.Parameters.FOCUS_MODE_AUTO as any)) {
        CLog(`setting focus mode to FOCUS_MODE_AUTO`);
        params.setFocusMode(android.hardware.Camera.Parameters.FOCUS_MODE_AUTO);
        this.camera.setParameters(params);
      }
    } else if (this.camera) {
      // autofocus not set so if we have camera then try to set to FIXED if device has fixed focus mode
      const params = this.camera.getParameters();
      const supportedFocusModes = params.getSupportedFocusModes();
      CLog(`supported focus modes = ${supportedFocusModes} --- ${DEVICE_INFO_STRING()}`);
      if (supportedFocusModes.contains(android.hardware.Camera.Parameters.FOCUS_MODE_FIXED as any)) {
        CLog(`setting focus mode to FOCUS_MODE_FIXED`);
        params.setFocusMode(android.hardware.Camera.Parameters.FOCUS_MODE_FIXED);
        this.camera.setParameters(params);
      }
    }
  }

  private _initFlashButton() {
    this._flashBtn = CamHelpers.createImageButton();
    // set correct flash icon on button
    this._ensureCorrectFlashIcon();
    const shape = CamHelpers.createTransparentCircleDrawable();
    this._flashBtn.setBackgroundDrawable(shape);
    this._flashBtn.setOnClickListener(
      new android.view.View.OnClickListener({
        onClick: args => {
          this.toggleFlash();
          this._ensureCorrectFlashIcon();
        }
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
    this._galleryBtn.setOnClickListener(
      new android.view.View.OnClickListener({
        onClick: args => {
          this.chooseFromLibrary();
        }
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
    this._toggleCamBtn.setOnClickListener(
      new android.view.View.OnClickListener({
        onClick: (view: android.view.View) => {
          this.toggleCamera();
        }
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
    this._takePicBtn.setOnClickListener(
      new android.view.View.OnClickListener({
        onClick: args => {
          CLog(`The default Take Picture event will attempt to save the image to gallery.`);
          const opts = {
            saveToGallery: true,
            confirm: this.confirmPhotos ? true : false,
            autoSquareCrop: this.autoSquareCrop
          };
          this.takePicture(opts);
        }
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

  /**
   * Helper method to create the Camera
   */
  private _initCamera(id?): void {
    try {
      CLog(`*** _initCamera ***\nthis.cameraId = ${this.cameraId} --- ${DEVICE_INFO_STRING()}`);
      if (this.camera === null) {
        this.cameraId = CAMERA_FACING_BACK;
      }

      if (id === null || id === undefined) {
        CLog(`opening new camera`);
        this.camera = android.hardware.Camera.open();
      } else {
        CLog(`opening camera with id = ${id}`);
        this.camera = android.hardware.Camera.open(id);
      }

      // send the loaded event on android here
      // prior to this point the camera won't be open so only the layout
      // is actually loaded, not necessarily the camera on device.
      this.sendEvent('loaded', this.camera);

      // need to check for the last cameraId and try to resume that camera and not lose the last opened camera
      if (id !== null && id !== undefined) {
        this.cameraId = id;
      } else {
        if (this.cameraId === CAMERA_FACING_BACK) {
          this.cameraId = CAMERA_FACING_BACK;
        } else {
          this.cameraId = CAMERA_FACING_FRONT;
        }
      }

      // setup autoFocus
      this._ensureFocusMode();

      this._setCameraDisplayOrientation(app.android.foregroundActivity, this.cameraId, this.camera);
      this.camera.setPreviewTexture(this._surface);
      this.camera.startPreview();
      this._ensureCorrectFlashIcon();
    } catch (ex) {
      CLog('error _initCamera', ex);
    }
  }

  /**
   * Correct the camera display orientation on the device.
   * See: https://developer.android.com/reference/android/hardware/Camera.html#setDisplayOrientation(int)
   * @param activity
   * @param cameraId
   * @param camera
   */
  private _setCameraDisplayOrientation(activity: android.app.Activity, cameraId, camera: android.hardware.Camera) {
    CLog(`*** _setCameraDisplayOrientation ***`);
    const info = new android.hardware.Camera.CameraInfo() as android.hardware.Camera.CameraInfo;
    android.hardware.Camera.getCameraInfo(cameraId, info);

    const params = this.camera.getParameters();

    const rotation = activity
      .getWindowManager()
      .getDefaultDisplay()
      .getRotation();
    CLog(`DISPLAY ROTATION = ${rotation}`);
    let degrees = 0;

    // tslint:disable-next-line:switch-default
    switch (rotation) {
      case 0:
        degrees = 0;
        break; // natural orientation
      case 1:
        degrees = 90;
        break; // landscape left
      case 2:
        degrees = 180;
        break; // upside down
      case 3:
        degrees = 270;
        break; // landscape right
    }

    let result;

    if (info.facing === CAMERA_FACING_FRONT) {
      CLog(`--- setting rotation for front facing camera --- \n --- info.orientation = ${info.orientation}`);
      result = (info.orientation + degrees) % 360;
      result = (360 - result) % 360; // compensate the mirror
      CLog(`result = ${result}`);

      // special handling for Nexus 6 and front facing camera
      const deviceModel = device.model.toLowerCase();
      const isNexus6 = deviceModel.indexOf('nexus') > -1 && deviceModel.indexOf('6') > -1;
      if (this.cameraId === CAMERA_FACING_FRONT && isNexus6) {
        params.setRotation(90);
      } else {
        params.setRotation(270); // set rotation to save the picture
      }
    } else {
      // back-facing
      CLog(`--- setting rotation for back facing camera --- \n --- info.orientation = ${info.orientation}`);
      result = (info.orientation - degrees + 360) % 360;
      CLog(`result = ${result}`);
      params.setRotation(result); // set rotation to save the picture
    }

    const mSupportedPreviewSizes = params.getSupportedPreviewSizes();
    const layoutWidth = this._nativeView.getWidth();
    const layoutHeight = this._nativeView.getHeight();
    const mPreviewSize = CamHelpers.getOptimalPreviewSize(mSupportedPreviewSizes, layoutWidth, layoutHeight);
    CLog(`mPreviewSize = ${mPreviewSize}`);
    if (mPreviewSize) {
      if (this.isVideoEnabled()) {
        // defaults for PNP specific
        let width = 1920;
        let height = 1080;
        if (mSupportedPreviewSizes) {
          // use maximum size (first one)
          const size = mSupportedPreviewSizes.get(0) as android.hardware.Camera.Size;
          if (size) {
            width = size.width;
            height = size.height;
          }
        }
        CLog(`setPreviewSize: ${width}x${height}`);
        // max size support to prevent stretch on video preview
        params.setPreviewSize(width, height);
      } else {
        params.setPreviewSize(mPreviewSize.width, mPreviewSize.height);
      }
    }

    const mSupportedPictureSizes = params.getSupportedPictureSizes();
    const mPictureSize = CamHelpers.getOptimalPictureSize(mSupportedPictureSizes, layoutWidth, layoutHeight);
    CLog(`mPictureSize = ${mPictureSize}`);

    params.setPictureSize(mPictureSize.width, mPictureSize.height);

    this.camera.setParameters(params); // set the parameters for the camera
    this.camera.setDisplayOrientation(result);

    if (this.isVideoEnabled() && this._mediaRecorder) {
      this._mediaRecorder.setOrientationHint(result);
    }
  }

  /**
   * Helper method to release the TextureSurface and the camera from the app.
   * If you don't do this a black hole opens up and we all die
   */
  private _releaseCameraAndPreview() {
    try {
      if (this._textureSurface !== null) {
        this._textureSurface.release();
        this._textureSurface = null;
      }

      if (this.camera) {
        this.camera.stopPreview();
        this.camera.release();
        this.camera = null;
      }
      if (this._mediaRecorder) {
        this._mediaRecorder.reset(); // clear recorder config
        this._mediaRecorder.release(); // release the recorder
        this._mediaRecorder = null;
      }
    } catch (ex) {
      CLog('error _releaseCameraAndPreview', ex);
    }
  }

  private _onPictureTaken(options, data) {
    //  go ahead and reset the camera - no point in holding up the preview
    this._releaseCameraAndPreview();
    this._initCamera(this.cameraId);

    // Check if app has EXTERNAL_STORAGE permission
    if (this.hasStoragePermissions() === true) {
      this._finishSavingAndConfirmingPicture(options, data);
    } else {
      CLog(`Application does not have permission to WRITE_EXTERNAL_STORAGE to save image.`);
      const result = this.requestStoragePermissions()
        .then((result: boolean) => {
          this._finishSavingAndConfirmingPicture(options, data);
        })
        .catch(ex => {
          CLog('Error requesting storage permissions', ex);
        });
    }
  }

  /**
   * The last piece before saving and/or confirming the picture taken.
   * @param opts
   * @param data
   */
  private async _finishSavingAndConfirmingPicture(options: ICameraOptions, data) {
    let confirmPic;
    let confirmPicRetakeText;
    let confirmPicSaveText;
    let saveToGallery;
    let reqWidth;
    let reqHeight;
    let shouldKeepAspectRatio;
    let shouldAutoSquareCrop = this.autoSquareCrop;

    const density = utils.layout.getDisplayDensity();
    if (options) {
      confirmPic = options.confirm ? true : false;
      confirmPicRetakeText = options.confirmRetakeText ? options.confirmRetakeText : this.confirmRetakeText;
      confirmPicSaveText = options.confirmSaveText ? options.confirmSaveText : this.confirmSaveText;
      saveToGallery = options.saveToGallery ? true : false;
      reqWidth = options.width ? options.width * density : 0;
      reqHeight = options.height ? options.height * density : reqWidth;
      shouldKeepAspectRatio = types.isNullOrUndefined(options.keepAspectRatio) ? true : options.keepAspectRatio;
      shouldAutoSquareCrop = !!options.autoSquareCrop;
    } else {
      // use xml property getters or their defaults
      CLog('Using property getters for defaults, no options.');
      confirmPic = this.confirmPhotos;
      saveToGallery = this.saveToGallery;
    }

    const dateStamp = CamHelpers.createDateTimeStamp();
    let picturePath: string;
    let nativeFile;

    // Gets the EXIF orientation, does not SAVE image...
    const orientation = CamHelpers.getOrientationFromBytes(data);

    // Sets up the matrix for rotation, if need be.
    const bitmapMatrix = new android.graphics.Matrix();
    switch (orientation) {
      case 1:
        break; // top left
      case 2:
        bitmapMatrix.postScale(-1, 1);
        break; // top right
      case 3:
        bitmapMatrix.postRotate(180);
        break; // bottom right
      case 4:
        bitmapMatrix.postRotate(180);
        bitmapMatrix.postScale(-1, 1);
        break; // bottom left
      case 5:
        bitmapMatrix.postRotate(90);
        bitmapMatrix.postScale(-1, 1);
        break; // left top
      case 6:
        bitmapMatrix.postRotate(90);
        break; // right top
      case 7:
        bitmapMatrix.postRotate(270);
        bitmapMatrix.postScale(-1, 1);
        break; // right bottom
      case 8:
        bitmapMatrix.postRotate(270);
        break;
    }

    // We only need to generate a new image IF,
    // we are SQUARING the image, or the orientation needs to be fixed
    if (shouldAutoSquareCrop || orientation > 1) {
      // https://developer.android.com/topic/performance/graphics/load-bitmap.html
      const bitmapOptions = new android.graphics.BitmapFactory.Options();
      bitmapOptions.inJustDecodeBounds = true;
      let originalBmp = android.graphics.BitmapFactory.decodeByteArray(data, 0, data.length, bitmapOptions);
      CLog('originalBmp', originalBmp);

      bitmapOptions.inSampleSize = CamHelpers.calculateInSampleSize(bitmapOptions, 1000, 1000);
      CLog('bitmapOptions.inSampleSize', bitmapOptions.inSampleSize);

      // decode with inSampleSize set now
      bitmapOptions.inJustDecodeBounds = false;

      originalBmp = android.graphics.BitmapFactory.decodeByteArray(data, 0, data.length, bitmapOptions);
      CLog('originalBmp', originalBmp);

      let width = originalBmp.getWidth();
      let height = originalBmp.getHeight();
      let finalBmp: android.graphics.Bitmap;

      if (shouldAutoSquareCrop) {
        let offsetWidth = 0;
        let offsetHeight = 0;
        if (width < height) {
          offsetHeight = (height - width) / 2;
          height = width;
        } else {
          offsetWidth = (width - height) / 2;
          width = height;
        }

        finalBmp = android.graphics.Bitmap.createBitmap(
          originalBmp,
          offsetWidth,
          offsetHeight,
          width,
          height,
          bitmapMatrix,
          false
        );
        CLog('finalBmp', finalBmp);
      } else {
        finalBmp = android.graphics.Bitmap.createBitmap(originalBmp, 0, 0, width, height, bitmapMatrix, false);
        CLog('finalBmp', finalBmp);
      }

      CLog('recycling originalBmp...');
      originalBmp.recycle();
      const outputStream = new java.io.ByteArrayOutputStream();

      CLog('compressing finalBmp...');
      finalBmp.compress(android.graphics.Bitmap.CompressFormat.JPEG, 100, outputStream);

      CLog('recycling finalBmp...');
      finalBmp.recycle();
      data = outputStream.toByteArray();
      CLog('byteArray data', data);

      try {
        CLog('closing outputStream...');
        outputStream.close();
      } catch (ex) {
        CLog('byteArrayOuputStream.close() error', ex);
        this.sendEvent(CameraPlus.errorEvent, ex, 'Error closing ByteArrayOutputStream.');
      }
    }

    const fileName = `IMG_${Date.now()}.jpg`;
    if (saveToGallery === true) {
      const folderPath =
        android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DCIM).toString() +
        '/Camera/';

      if (!fs.Folder.exists(folderPath)) {
        fs.Folder.fromPath(folderPath);
      }
      picturePath = fs.path.join(folderPath, fileName);

      // const path = android.os.Environment
      //   .getExternalStoragePublicDirectory(DIRECTORY_PICTURES)
      //   .getAbsolutePath();
      // picturePath = path + "/" + "IMG_" + dateStamp + ".jpg";
      nativeFile = new java.io.File(picturePath);
    } else {
      const folderPath = utils.ad
        .getApplicationContext()
        .getExternalFilesDir(null)
        .getAbsolutePath();
      if (!fs.Folder.exists(folderPath)) {
        fs.Folder.fromPath(folderPath);
      }
      picturePath = fs.path.join(folderPath, fileName);
      nativeFile = new java.io.File(picturePath);
    }

    CLog('picturePath', picturePath);
    CLog('nativeFile', nativeFile);

    if (confirmPic === true) {
      this.sendEvent(CameraPlus.confirmScreenShownEvent);
      const result = await CamHelpers.createImageConfirmationDialog(
        data,
        confirmPicRetakeText,
        confirmPicSaveText
      ).catch(ex => {
        CLog('Error createImageConfirmationDialog', ex);
      });

      this.sendEvent(CameraPlus.confirmScreenDismissedEvent);

      CLog(`confirmation result = ${result}`);
      if (result !== true) {
        return;
      }

      // Save image to device gallery
      this._savePicture(nativeFile, data, saveToGallery === true);

      const asset = CamHelpers.assetFromPath(picturePath, reqWidth, reqHeight, shouldKeepAspectRatio);

      this.sendEvent(CameraPlus.photoCapturedEvent, asset);
      return;
    } else {
      this._savePicture(nativeFile, data, saveToGallery === true);

      const asset = CamHelpers.assetFromPath(picturePath, reqWidth, reqHeight, shouldKeepAspectRatio);
      this.sendEvent(CameraPlus.photoCapturedEvent, asset);
      return;
    }
  }

  private _savePicture(file, data, broadcastToGallery) {
    try {
      this._saveImageToDisk(file, data);
      if (broadcastToGallery === true) {
        this._addPicToGallery(file);
      }
    } catch (ex) {
      CLog('_savePicture error', ex);
    }
  }

  /**
   * Save the image data to disk with the new File
   * @param picFile
   * @param data
   */
  private _saveImageToDisk(picFile, data) {
    let fos = null;
    try {
      fos = new java.io.FileOutputStream(picFile);
      CLog('fileOutputStream', fos);
      fos.write(data);
      CLog('closing fileOutputStream...');
      fos.close();
    } catch (ex) {
      CLog(`error with fileOutputStream = ${ex}`);
      this.sendEvent(CameraPlus.errorEvent, ex, 'Error saving the image to disk.');
    }
  }

  /**
   * Broadcasts an intent with the new image, this tells the OS an image has been added so it will show in the gallery.
   * @param picFile
   */
  private _addPicToGallery(picFile) {
    // checking exif data for orientation issues
    try {
      const ExifInterface = ExifInterfaceNamespace().ExifInterface;
      const exifInterface = new ExifInterface(picFile.getPath());
      const tagOrientation = exifInterface.getAttributeInt(
        ExifInterface.TAG_ORIENTATION,
        ExifInterface.ORIENTATION_NORMAL
      );
      CLog(`tagOrientation = ${tagOrientation}`);
      const contentUri = android.net.Uri.fromFile(picFile) as android.net.Uri;
      const mediaScanIntent = new android.content.Intent(
        'android.intent.action.MEDIA_SCANNER_SCAN_FILE',
        contentUri
      ) as android.content.Intent;
      (app.android.context as android.content.Context).sendBroadcast(mediaScanIntent);
    } catch (ex) {
      CLog('_addPicToGallery error', ex);
      this.sendEvent(CameraPlus.errorEvent, ex, 'Error adding image to device library.');
    }
  }
}

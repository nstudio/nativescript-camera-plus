/**********************************************************************************
 * (c) 2017, nStudio, LLC & LiveShopper, LLC
 *
 * Version 1.1.0                                                    team@nStudio.io
 **********************************************************************************/

import { Color } from 'tns-core-modules/color';
import * as fs from 'tns-core-modules/file-system/file-system';
import { ImageAsset } from 'tns-core-modules/image-asset';
import * as platform from 'tns-core-modules/platform';
import { View } from 'tns-core-modules/ui/core/view';
import * as types from 'tns-core-modules/utils/types';
import {
  CameraPlusBase,
  CameraTypes,
  CameraVideoQuality,
  CLog,
  GetSetProperty,
  ICameraOptions,
  IChooseOptions,
  IVideoOptions
} from './camera-plus.common';

export * from './camera-plus.common';
export { CameraVideoQuality } from './camera-plus.common';
/**
 * Library image picker delegate (multiple or single)
 */
class QBImagePickerControllerDelegateImpl extends NSObject implements QBImagePickerControllerDelegate {
  public static ObjCProtocols = [QBImagePickerControllerDelegate];

  static new(): QBImagePickerControllerDelegateImpl {
    return <QBImagePickerControllerDelegateImpl>super.new();
  }

  private _owner: WeakRef<MySwifty>;
  private _callback: (result?) => void;

  private _width: number;
  private _height: number;
  private _keepAspectRatio: boolean;

  public initWithCallback(owner: WeakRef<MySwifty>, callback: (result?) => void): QBImagePickerControllerDelegateImpl {
    this._owner = owner;
    this._callback = callback;
    return this;
  }

  public initWithCallbackAndOptions(
    owner: WeakRef<MySwifty>,
    callback: (result?) => void,
    options?
  ): QBImagePickerControllerDelegateImpl {
    this._owner = owner;
    this._callback = callback;
    if (options) {
      this._width = options.width;
      this._height = options.height;
      this._keepAspectRatio = types.isNullOrUndefined(options.keepAspectRatio) ? true : options.keepAspectRatio;
    } else {
      this._keepAspectRatio = true; // always default to true
    }
    return this;
  }

  // create date from a string with format yyyy:MM:dd HH:mm:ss (like the format used in image description)
  private createDateFromString(value: string): Date {
    const year = parseInt(value.substr(0, 4));
    const month = parseInt(value.substr(5, 2));
    const date = parseInt(value.substr(8, 2));

    const hour = parseInt(value.substr(11, 2));
    const minutes = parseInt(value.substr(14, 2));
    const seconds = parseInt(value.substr(17, 2));

    return new Date(year, month - 1, date, hour, minutes, seconds);
  }

  qb_imagePickerControllerDidFinishPickingAssets(picker, assets: NSArray<PHAsset>): void {
    const selection = [];
    const manager = PHImageManager.defaultManager();
    // let scale = UIScreen.mainScreen.scale;
    const targetSize = PHImageManagerMaximumSize;
    const requestOptions = PHImageRequestOptions.alloc().init();
    requestOptions.resizeMode = PHImageRequestOptionsResizeMode.Exact;
    requestOptions.synchronous = false;
    requestOptions.deliveryMode = PHImageRequestOptionsDeliveryMode.HighQualityFormat;
    requestOptions.normalizedCropRect = CGRectMake(0, 0, 1, 1);
    requestOptions.version = PHImageRequestOptionsVersion.Original;
    requestOptions.networkAccessAllowed = true;

    let cnt = 0;

    const next = function() {
      cnt++;
      if (cnt === assets.count) {
        this._callback(selection);
        this._owner.get().closePicker();
      } else {
        requestImg(cnt);
      }
    };

    const requestImg = (i: number) => {
      // Do something with the asset
      const asset = assets.objectAtIndex(i);
      if (asset.mediaType === PHAssetMediaType.Image) {
        // ios >= 13 added this api to get the original image
        if (manager.requestImageDataAndOrientationForAssetOptionsResultHandler) {
          manager.requestImageDataAndOrientationForAssetOptionsResultHandler(
            asset,
            requestOptions,
            (imageData: NSData, dataUti: string, orientation: CGImagePropertyOrientation, info: NSDictionary<any, any>) => {
              const image = new UIImage({data: imageData});
              const imageAsset = new ImageAsset(image);
              if (this._width) imageAsset.options.width = this._width;
              if (this._height) imageAsset.options.height = this._height;
              selection.push(imageAsset);
              next.call(this);
            }
          );
        }
        else {
          manager.requestImageForAssetTargetSizeContentModeOptionsResultHandler(
            asset,
            targetSize,
            PHImageContentMode.AspectFill,
            requestOptions,
            (image: UIImage, info: NSDictionary<any, any>) => {
              const imageAsset = new ImageAsset(image);
              if (this._width) imageAsset.options.width = this._width;
              if (this._height) imageAsset.options.height = this._height;
              selection.push(imageAsset);
              next.call(this);
            }
          );
        }
      } else if (asset.mediaType === PHAssetMediaType.Video) {
        const requestOptions = PHVideoRequestOptions.alloc().init();
        requestOptions.version = PHVideoRequestOptionsVersion.Original;
        requestOptions.networkAccessAllowed = true;

        manager.requestAVAssetForVideoOptionsResultHandler(
          asset,
          requestOptions,
          (videoAsset: AVAsset, audioMix, info) => {
            if (videoAsset.isKindOfClass(AVURLAsset.class())) {
              const docsPath = fs.knownFolders.documents();

              const pathParts = (<AVURLAsset>videoAsset).URL.toString().split(fs.path.separator);
              const filename = pathParts[pathParts.length - 1];
              const localFilePath = fs.path.join(docsPath.path, 'camera-plus-videos', filename);

              const targetURL = NSURL.fileURLWithPath(localFilePath);

              if (fs.File.exists(localFilePath)) {
                docsPath.getFile('camera-plus-videos/' + filename).remove();
              } else {
                // make sure the folder exists, or else copyItemAtURLToURLError
                // will complain about it
                docsPath.getFolder('camera-plus-videos');
              }

              // the video can be compied from gallery only when the request is open
              // so we move the video to the documents folder
              const result = NSFileManager.defaultManager.copyItemAtURLToURLError(
                (<AVURLAsset>videoAsset).URL,
                targetURL
              );

              if (result) {
                selection.push(localFilePath);
              }
            }
            next.call(this);
          }
        );
      }
    };
    requestImg(0);
  }

  qb_imagePickerControllerDidCancel(picker): void {
    this._owner.get().closePicker();
  }
}

/**
 * Take picture with camera delegate
 */
export class SwiftyDelegate extends NSObject implements SwiftyCamViewControllerDelegate {
  public static ObjCProtocols = [SwiftyCamViewControllerDelegate];
  private _owner: WeakRef<MySwifty>;

  public static initWithOwner(owner: WeakRef<MySwifty>) {
    const delegate = <SwiftyDelegate>SwiftyDelegate.new();
    delegate._owner = owner;
    return delegate;
  }

  swiftyCamDidFailToConfigure(swiftyCam: SwiftyCamViewController) {
    CLog('swiftyCamDidFailToConfigure:');
  }

  swiftyCamDidFailToRecordVideo(swiftyCam: SwiftyCamViewController, error: NSError) {
    CLog('swiftyCamDidFailToRecordVideo:');
  }

  swiftyCamNotAuthorized(swiftyCam: SwiftyCamViewController) {
    CLog('swiftyCamNotAuthorized:');
  }

  swiftyCamSessionDidStopRunning(swiftyCam: SwiftyCamViewController) {
    CLog('swiftyCamSessionDidStopRunning:');
  }

  swiftyCamSessionDidStartRunning(swiftyCam: SwiftyCamViewController) {
    CLog('swiftyCamSessionDidStartRunning:');
    this._owner.get().doLayout();
  }

  swiftyCamDidBeginRecordingVideo(swiftyCam: SwiftyCamViewController, camera: CameraSelection) {
    CLog('swiftyCamDidBeginRecordingVideo:', camera);
    this._owner.get().didStartRecording(camera);
  }

  swiftyCamDidChangeZoomLevel(swiftyCam: SwiftyCamViewController, zoom: number) {
    CLog('swiftyCamDidChangeZoomLevel:', zoom);
  }

  swiftyCamDidFinishProcessVideoAt(swiftyCam: SwiftyCamViewController, url: NSURL) {
    CLog('swiftyCamDidFinishProcessVideoAt:', url);
    this._owner.get().recordingReady(url.path);
  }

  swiftyCamDidFinishRecordingVideo(swiftyCam: SwiftyCamViewController, camera: CameraSelection) {
    CLog('swiftyCamDidFinishRecordingVideo:', camera);
    this._owner.get().didFinishRecording(camera);
  }

  swiftyCamDidFocusAtPoint(swiftyCam: SwiftyCamViewController, point: CGPoint) {
    CLog('swiftyCamDidFocusAtPoint:', point);
  }

  swiftyCamDidSwitchCameras(swiftyCam: SwiftyCamViewController, camera: CameraSelection) {
    CLog('swiftyCamDidSwitchCameras:', camera);
    this._owner.get().didSwitchCamera(camera);
  }

  swiftyCamDidTake(swiftyCam: SwiftyCamViewController, photo: UIImage) {
    CLog('swiftyCamDidTake:', photo);
    try {
      // UIImageWriteToSavedPhotosAlbum(photo, this._owner.get(), 'thisImage:hasBeenSavedInPhotoAlbumWithError:usingContextInfo:', null);

      this._owner.get().tookPhoto(photo);
    } catch (err) {
      CLog(err);
    }
  }
}

export class MySwifty extends SwiftyCamViewController {
  public static ObjCExposedMethods = {
    switchCam: { returns: interop.types.void },
    resetPreview: { returns: interop.types.void },
    savePhoto: { returns: interop.types.void },
    snapPicture: { returns: interop.types.void },
    toggleFlash: { returns: interop.types.void },
    openGallery: { returns: interop.types.void },
    recordVideo: { returns: interop.types.void },
    videoDidFinishSavingWithErrorContextInfo: {
      returns: interop.types.void,
      params: [NSString, NSError, interop.Pointer]
    }
    // 'deviceDidRotate': { returns: interop.types.void }
    // 'thisImage:hasBeenSavedInPhotoAlbumWithError:usingContextInfo:': {
    //   returns: interop.types.void,
    //   params: [UIImage, NSError, interop.Pointer]
    // }
  };
  private _owner: WeakRef<CameraPlus>;
  private _snapPicOptions: ICameraOptions;
  private _enableVideo: boolean;
  private _videoOptions: IVideoOptions;
  private _videoPath: string;
  private _isRecording: boolean;
  private _photoToSave: any;
  private _imageConfirmBg: UIView;
  private _flashEnabled: boolean;
  private _flashBtn: UIButton;
  private _swiftyDelegate: any;
  private _pickerDelegate: any;
  private _resized: boolean;

  public static initWithOwner(owner: WeakRef<CameraPlus>, defaultCamera: CameraTypes = 'rear') {
    CLog('MySwifty initWithOwner');
    const ctrl = <MySwifty>MySwifty.new();
    CLog('ctrl', ctrl);
    ctrl._owner = owner;
    // set default camera
    ctrl.defaultCamera = defaultCamera === 'rear' ? CameraSelection.Rear : CameraSelection.Front;
    CLog('ctrl.disableAudio:', ctrl.disableAudio);
    CLog('ctrl.defaultCamera:', defaultCamera);
    return ctrl;
  }

  public cleanup() {
    this._swiftyDelegate = null;
  }

  public set enableVideo(value: boolean) {
    this._enableVideo = value;
  }

  public set pickerDelegate(value: any) {
    this._pickerDelegate = value;
  }

  public closePicker() {
    rootVC().dismissViewControllerAnimatedCompletion(true, () => {
      this.pickerDelegate = null;
    });
  }

  viewDidLoad() {
    CLog('MySwifty viewdidload');
    super.viewDidLoad();
    this.view.userInteractionEnabled = true;
    const doubleTapEnabled = this._owner.get().doubleTapCameraSwitch;
    this.doubleTapCameraSwitch = doubleTapEnabled;
    CLog('doubleTapCameraSwitch:', doubleTapEnabled);

    // CLog('view.frame.size:', this.view.frame.size.width + 'x' + this.view.frame.size.height);
    // retain delegate in javascript to ensure garbage collector does not get it
    this._swiftyDelegate = <any>SwiftyDelegate.initWithOwner(new WeakRef(this));
    this.cameraDelegate = this._swiftyDelegate;
    CLog('this.cameraDelegate:', this.cameraDelegate);
  }

  doLayout() {
    const size = this._owner.get().getActualSize();
    const nativeView = this._owner.get().nativeView;
    const frame = nativeView.frame;
    nativeView.frame = CGRectMake(frame.origin.x, frame.origin.y, size.width, size.height);
    nativeView.setNeedsLayout();
  }

  viewDidLayoutSubviews() {
    CLog('MySwifty viewDidLayoutSubviews');
    super.viewDidLayoutSubviews();
  }

  viewDidAppear(animated: boolean) {
    super.viewDidAppear(animated);
    CLog('MySwifty viewDidAppear');
  }

  viewWillAppear(animated: boolean) {
    super.viewWillAppear(animated);
    CLog('MySwifty viewWillAppear');
  }

  // public deviceDidRotate() {
  //   super.deviceDidRotate();
  //   CLog('deviceDidRotate!');
  //   if (this.previewLayer && this.previewLayer.videoPreviewLayer) {
  //     this.previewLayer.videoPreviewLayer.connection.videoOrientation = this.getPreviewLayerOrientation();
  //   }
  // }

  // public resize(width?: any, height?: any) {
  //     if (typeof width !== 'number') {
  //         width = screen.mainScreen.widthDIPs;
  //     }
  //     if (typeof height !== 'number') {
  //         height = screen.mainScreen.heightDIPs;
  //     }
  //     CLog('resizing to:', width + 'x' + height);
  //     this.view.frame = CGRectMake(0, 0, width, height);
  //     CLog('view.bounds:', this.view.bounds.size.width + 'x' + this.view.bounds.size.height);
  //     if (!this._resized) {
  //         this._resized = true;
  //         this._addButtons();
  //         this.viewDidAppear(true);
  //     }
  // }

  public snapPicture(options?: ICameraOptions) {
    CLog('CameraPlus takePic options:', options);
    if (options) {
      this._snapPicOptions = options;
    } else {
      this._snapPicOptions = {
        confirm: this._owner.get().confirmPhotos, // from property setter
        confirmRetakeText: this._owner.get().confirmRetakeText,
        confirmSaveText: this._owner.get().confirmSaveText,
        saveToGallery: this._owner.get().saveToGallery
      };
    }
    this.takePhoto();
  }

  public recordVideo(options?: IVideoOptions) {
    if (this._enableVideo) {
      if (this.isVideoRecording) {
        CLog('CameraPlus stop video recording.');
        this.stopVideoRecording();
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
        if (!options.disableHEVC && parseFloat(platform.device.sdkVersion) >= 11) {
          this.videoCodecType = AVVideoCodecTypeHEVC;
        }
        switch (options ? options.quality : CameraVideoQuality.MAX_480P) {
          case CameraVideoQuality.MAX_2160P:
            this.videoQuality = VideoQuality.Resolution3840x2160;
            break;
          case CameraVideoQuality.MAX_1080P:
            this.videoQuality = VideoQuality.Resolution1920x1080;
            break;
          case CameraVideoQuality.MAX_720P:
            this.videoQuality = VideoQuality.Resolution1280x720;
            break;
          case CameraVideoQuality.HIGHEST:
            this.videoQuality = VideoQuality.High;
            break;
          case CameraVideoQuality.LOWEST:
            this.videoQuality = VideoQuality.Low;
            break;
          case CameraVideoQuality.QVGA:
            this.videoQuality = VideoQuality.Resolution352x288;
            break;
          default:
            this.videoQuality = VideoQuality.Resolution640x480;
            break;
        }

        const status = PHPhotoLibrary.authorizationStatus();
        if (status === PHAuthorizationStatus.NotDetermined) {
          PHPhotoLibrary.requestAuthorization(status => {
            this.startVideoRecording();
          });
        } else {
          this.startVideoRecording();
        }
      }
    }
  }

  public didStartRecording(camera: CameraSelection) {
    this._owner.get().sendEvent(CameraPlus.videoRecordingStartedEvent, camera);
  }

  public recordingReady(path: string) {
    if ((this._videoOptions && this._videoOptions.saveToGallery) || this._owner.get().saveToGallery) {
      // TODO: discuss why callback handler(videoDidFinishSavingWithErrorContextInfo) does not emit event correctly - the path passed to the handler is the same as handled here so just go ahead and emit here for now
      this._owner.get().sendEvent(CameraPlus.videoRecordingReadyEvent, path);

      const status = PHPhotoLibrary.authorizationStatus();
      if (status === PHAuthorizationStatus.Authorized) {
        UISaveVideoAtPathToSavedPhotosAlbum(path, this, 'videoDidFinishSavingWithErrorContextInfo', null);
      }
    } else {
      CLog(`video not saved to gallery but recording is at: ${path}`);
      this._owner.get().sendEvent(CameraPlus.videoRecordingReadyEvent, path);
    }
  }

  public didFinishRecording(camera: CameraSelection) {
    this._owner.get().sendEvent(CameraPlus.videoRecordingFinishedEvent, camera);
  }

  public videoDidFinishSavingWithErrorContextInfo(path: string, error: NSError, contextInfo: any) {
    if (error) {
      CLog('video save to camera roll error:');
      CLog(error);
      return;
    }
    CLog(`video saved`, path);

    // ideally could just rely on this, but this will not emit the event (commenting for now and instead doing above in recordready - TODO: discuss why)
    // this._owner.get().sendEvent(CameraPlus.videoRecordingReadyEvent, path);
  }

  public switchCam() {
    CLog('CameraPlus switchCam');
    this.switchCamera();
  }

  public toggleFlash() {
    this._flashEnabled = !this._flashEnabled;
    this.flashEnabled = this._flashEnabled; // super class behavior
    CLog('CameraPlus flash enabled:', this._flashEnabled);
    this._flashBtnHandler();
  }

  public openGallery() {
    CLog('CameraPlus openGallery');
    const width = this._owner.get().galleryPickerWidth;
    const height = this._owner.get().galleryPickerHeight;
    const keepAspectRatio = this._owner.get().keepAspectRatio;
    const showVideos = this._enableVideo;
    this.chooseFromLibrary({ width, height, keepAspectRatio, showVideos });
  }

  // public thisImageHasBeenSavedInPhotoAlbumWithErrorUsingContextInfo(image, error, context) {
  //   CLog('thisImageHasBeenSavedInPhotoAlbumWithErrorUsingContextInfo', image);
  //   if (error) {
  //     CLog(error);
  //   }
  // }

  public tookPhoto(photo: UIImage) {
    this._photoToSave = photo;
    CLog('tookPhoto!');

    if (this._snapPicOptions && this._snapPicOptions.confirm) {
      // show the confirmation
      const width = this.view.bounds.size.width;
      const height = this.view.bounds.size.height;
      this._imageConfirmBg = UIView.alloc().initWithFrame(CGRectMake(0, 0, width, height));
      this._imageConfirmBg.backgroundColor = UIColor.blackColor;

      // confirm user wants to keep photo
      const imageConfirm = UIImageView.alloc().init();
      imageConfirm.contentMode = UIViewContentMode.ScaleAspectFit;
      imageConfirm.image = photo;
      imageConfirm.frame = CGRectMake(0, 50, width, height - 40);
      // add 'Retake' in bottom left and 'Save Photo' in bottom right
      const retakeBtn = createButton(
        this,
        CGRectMake(10, 10, 75, 50),
        this._snapPicOptions.confirmRetakeText ? this._snapPicOptions.confirmRetakeText : 'Retake',
        'resetPreview'
      );
      const saveBtn = createButton(
        this,
        CGRectMake(width - 170, 10, 150, 50),
        this._snapPicOptions.confirmSaveText ? this._snapPicOptions.confirmSaveText : 'Save',
        'savePhoto',
        'right'
      );

      this._imageConfirmBg.addSubview(imageConfirm);
      this._imageConfirmBg.addSubview(retakeBtn);
      this._imageConfirmBg.addSubview(saveBtn);
      this.view.addSubview(this._imageConfirmBg);
      this._owner.get().sendEvent(CameraPlus.confirmScreenShownEvent);
    } else {
      // no confirmation - just save
      this.savePhoto();
      return;
    }
  }

  public resetPreview() {
    if (this._imageConfirmBg) {
      this._imageConfirmBg.removeFromSuperview();
      this._imageConfirmBg = null;
      this._owner.get().sendEvent(CameraPlus.confirmScreenDismissedEvent);
    }
  }

  public savePhoto() {
    if (this._photoToSave) {
      if ((this._snapPicOptions && this._snapPicOptions.saveToGallery) || this._owner.get().saveToGallery) {
        UIImageWriteToSavedPhotosAlbum(this._photoToSave, null, null, null);
      }
      this._owner.get().sendEvent(CameraPlus.photoCapturedEvent, new ImageAsset(this._photoToSave));
      this.resetPreview();
    }
  }

  public didSwitchCamera(camera: CameraSelection) {
    this._owner.get().sendEvent(CameraPlus.toggleCameraEvent, camera);
  }

  public isCameraAvailable() {
    return UIImagePickerController.isSourceTypeAvailable(UIImagePickerControllerSourceType.Camera);
  }

  public chooseFromLibrary(options?: IChooseOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      this._pickerDelegate = null;
      const imagePickerController = QBImagePickerController.new();
      let reqWidth = 0;
      let reqHeight = 0;
      let keepAspectRatio = true;
      if (options) {
        reqWidth = options.width || reqWidth;
        reqHeight = options.height || reqHeight;
        keepAspectRatio = types.isNullOrUndefined(options.keepAspectRatio) ? true : options.keepAspectRatio;
      } else {
        options = {
          showImages: true,
          showVideos: this._enableVideo
        };
      }

      const authStatus = PHPhotoLibrary.authorizationStatus();

      if (reqWidth && reqHeight) {
        this._pickerDelegate = QBImagePickerControllerDelegateImpl.new().initWithCallbackAndOptions(
          new WeakRef(this),
          result => {
            CLog('chosen from library:', result);
            this._owner.get().sendEvent(CameraPlus.imagesSelectedEvent, result);
            resolve(result);
          },
          { width: reqWidth, height: reqHeight, keepAspectRatio: keepAspectRatio }
        );
      } else {
        this._pickerDelegate = QBImagePickerControllerDelegateImpl.new().initWithCallback(new WeakRef(this), result => {
          CLog('chosen from library:', result);
          this._owner.get().sendEvent(CameraPlus.imagesSelectedEvent, result);
          resolve(result);
        });
      }
      imagePickerController.delegate = this._pickerDelegate;
      const galleryPickerMode = this._owner.get().galleryPickerMode;
      CLog('galleryPickerMode:', galleryPickerMode);
      const galleryMax = this._owner.get().galleryMax;
      CLog('galleryMax:', galleryMax);
      imagePickerController.allowsMultipleSelection = galleryPickerMode === 'multiple';
      imagePickerController.maximumNumberOfSelection = galleryMax;
      imagePickerController.showsNumberOfSelectedAssets = true;

      imagePickerController.modalPresentationStyle = UIModalPresentationStyle.CurrentContext;

      let mediaType = QBImagePickerMediaType.Any;

      if (options.showImages === undefined) {
        options.showImages = true;
      }

      if (!options.showImages && options.showVideos) {
        mediaType = QBImagePickerMediaType.Video;
      } else {
        if (options.showImages && !options.showVideos) {
          mediaType = QBImagePickerMediaType.Image;
        }
      }

      imagePickerController.mediaType = mediaType;

      rootVC().presentViewControllerAnimatedCompletion(imagePickerController, true, null);
    });
  }

  _addButtons() {
    CLog('adding buttons...');
    const width = this.view.bounds.size.width;
    const height = this.view.bounds.size.height;

    if (this._owner.get().showToggleIcon) {
      CLog('adding toggle/switch camera button...');
      const switchCameraBtn = createButton(
        this,
        CGRectMake(width - 100, 20, 100, 50),
        null,
        'switchCam',
        null,
        createIcon('toggle', CGSizeMake(65, 50))
      );
      switchCameraBtn.transform = CGAffineTransformMakeScale(0.75, 0.75);
      this.view.addSubview(switchCameraBtn);
    }

    this._flashBtnHandler();

    if (this._owner.get().showGalleryIcon === true) {
      const galleryBtn = createButton(
        this,
        CGRectMake(20, height - 80, 50, 50),
        null,
        'openGallery',
        null,
        createIcon('gallery')
      );
      galleryBtn.transform = CGAffineTransformMakeScale(0.75, 0.75);
      this.view.addSubview(galleryBtn);
    }

    if (this._owner.get().showCaptureIcon) {
      const heightOffset = this._owner.get().isIPhoneX ? 200 : 110;
      const picOutline = createButton(
        this,
        CGRectMake(width / 2 - 20, height - heightOffset, 50, 50),
        null,
        null,
        null,
        createIcon('picOutline')
      );
      picOutline.transform = CGAffineTransformMakeScale(1.5, 1.5);
      this.view.addSubview(picOutline);
      const takePicBtn = createButton(
        this,
        CGRectMake(width / 2 - 21.5, height - (heightOffset + 0.7), 50, 50),
        null,
        this._enableVideo ? 'recordVideo' : 'snapPicture',
        null,
        createIcon('takePic')
      );
      // takePicBtn.transform = CGAffineTransformMakeScale(1.5, 1.5);
      this.view.addSubview(takePicBtn);
    }
  }

  private _flashBtnHandler() {
    if (this._owner.get().showFlashIcon) {
      if (this._flashBtn) this._flashBtn.removeFromSuperview();
      if (this.flashEnabled) {
        this._flashBtn = createButton(this, CGRectMake(20, 20, 50, 50), null, 'toggleFlash', null, createIcon('flash'));
      } else {
        this._flashBtn = createButton(
          this,
          CGRectMake(20, 20, 50, 50),
          null,
          'toggleFlash',
          null,
          createIcon('flashOff')
        );
      }
      this._flashBtn.transform = CGAffineTransformMakeScale(0.75, 0.75);
      this.view.addSubview(this._flashBtn);
    }
  }
}

export class CameraPlus extends CameraPlusBase {
  public static useDeviceOrientation: boolean = false; // experimental
  // swiftyviewcontroller
  private _swifty: MySwifty;
  private _isIPhoneX: boolean;

  @GetSetProperty()
  public enableVideo: boolean;

  @GetSetProperty()
  public resizeAspectFill: boolean;

  // library picker handling
  private _galleryMax: number = 3;
  private _galleryPickerWidth: number;
  private _galleryPickerHeight: number;
  private _keepAspectRatio: boolean;

  constructor() {
    super();
    this._onLayoutChangeListener = this._onLayoutChangeFn.bind(this);
    CLog('CameraPlus constructor');
    this._swifty = MySwifty.initWithOwner(new WeakRef(this), CameraPlus.defaultCamera);
    this._swifty.shouldPrompToAppSettings = false;

    // experimenting with static flag (this is usually explicitly false)
    // enable device orientation
    this._swifty.shouldUseDeviceOrientation = CameraPlus.useDeviceOrientation;
    this._detectDevice();
  }

  private isVideoEnabled() {
    return this.enableVideo === true || CameraPlus.enableVideo;
  }

  private hasVideoGravity() {
    return this.resizeAspectFill === true || CameraPlus.resizeAspectFill;
  }

  createNativeView() {
    if (this.hasVideoGravity()) {
      this._swifty.videoGravity = SwiftyCamVideoGravity.ResizeAspectFill;
    }
    
    this._swifty.enableVideo = this.isVideoEnabled();
    // disable audio if no video support
    this._swifty.disableAudio = !this.isVideoEnabled();
    CLog('CameraPlus createNativeView');
    CLog('video enabled:', this.isVideoEnabled());
    CLog('default camera:', CameraPlus.defaultCamera);
    CLog(this._swifty.view);
    this._swifty.view.autoresizingMask = UIViewAutoresizing.FlexibleWidth | UIViewAutoresizing.FlexibleHeight;
    return this._swifty.view;
  }

  private _onLayoutChangeFn(args) {
    const size = this.getActualSize();
    CLog('xml width/height:', size.width + 'x' + size.height);
    const frame = this._swifty.view.frame;
    this._swifty.view.frame = CGRectMake(frame.origin.x, frame.origin.y, size.width, size.height);
    this._swifty.previewLayer.frame = CGRectMake(frame.origin.x, frame.origin.y, size.width, size.height);
    this._swifty.view.setNeedsLayout();
    this._swifty.previewLayer.setNeedsLayout();
  }

  private _onLayoutChangeListener: any;

  initNativeView() {
    CLog('initNativeView.');
    this.on(View.layoutChangedEvent, this._onLayoutChangeListener);
    this._swifty.viewWillAppear(true);
  }

  disposeNativeView() {
    CLog('disposeNativeView.');
    this._swifty.cleanup();
    this.off(View.layoutChangedEvent, this._onLayoutChangeListener);
    super.disposeNativeView();
  }

  onLoaded() {
    super.onLoaded();
    this._swifty._addButtons();
    this._swifty.viewDidAppear(true);
  }

  onUnloaded() {
    this._swifty.viewDidDisappear(true);
    super.onUnloaded();
  }

  public get isIPhoneX() {
    return this._isIPhoneX;
  }

  public get galleryPickerWidth() {
    return this._galleryPickerWidth;
  }

  public set galleryPickerWidth(value: number) {
    this._galleryPickerWidth = value;
  }

  public get galleryPickerHeight() {
    return this._galleryPickerHeight;
  }

  public set galleryPickerHeight(value: number) {
    this._galleryPickerHeight = value;
  }

  public get keepAspectRatio() {
    return this._keepAspectRatio;
  }

  public set keepAspectRatio(value: boolean) {
    this._keepAspectRatio = value;
  }

  public get galleryMax() {
    return this._galleryMax;
  }

  public set galleryMax(value: number) {
    this._galleryMax = value;
  }

  /**
   * Toggle Camera front/back
   */
  public toggleCamera() {
    this._swifty.switchCam();
  }

  /**
   * Toggle flash mode
   */
  public toggleFlash() {
    this._swifty.toggleFlash();
  }

  /**
   * Return the current flash mode (either 'on' or 'off' for iOS)
   */
  public getFlashMode(): 'on' | 'off' {
    return this._swifty.flashEnabled ? 'on' : 'off';
  }

  /**
   * Open library picker
   * @param options IChooseOptions
   */
  public chooseFromLibrary(options?: IChooseOptions): Promise<any> {
    return this._swifty.chooseFromLibrary(options);
  }

  /**
   * Snap photo and display confirm save
   */
  public takePicture(options?: ICameraOptions): void {
    this._swifty.snapPicture(options);
  }

  /**
   * Record video
   */
  public record(options?: IVideoOptions): Promise<any> {
    this._swifty.recordVideo(options);
    return Promise.resolve();
  }

  /**
   * Stop recording video
   */
  public stop(): void {
    if (this.isVideoEnabled()) {
      this._swifty.stopVideoRecording();
    }
  }

  /**
   * Gets current camera selection
   */
  public getCurrentCamera(): 'front' | 'rear' {
    const cam = this._swifty.currentCamera;
    if (cam === CameraSelection.Front) {
      return 'front';
    } else {
      return 'rear';
    }
  }

  /**
   * Is camera available for use
   */
  public isCameraAvailable() {
    return this._swifty.isCameraAvailable();
  }

  private _detectDevice() {
    if (typeof this._isIPhoneX === 'undefined') {
      const _SYS_NAMELEN: number = 256;

      /* tslint:disable-next-line: no-any */
      const buffer: any = interop.alloc(5 * _SYS_NAMELEN);
      uname(buffer);
      let name: string = NSString.stringWithUTF8String(buffer.add(_SYS_NAMELEN * 4)).toString();

      // Get machine name for Simulator
      if (name === 'x86_64' || name === 'i386') {
        name = NSProcessInfo.processInfo.environment.objectForKey('SIMULATOR_MODEL_IDENTIFIER');
      }

      // this._log.debug('isIPhoneX name:', name);
      const parts = name.toLowerCase().split('iphone');
      if (parts && parts.length > 1) {
        const versionNumber = parseInt(parts[1]);
        if (!isNaN(versionNumber)) {
          // all above or greater than 11 are X devices
          this._isIPhoneX = versionNumber >= 11;
        }
      }
      if (!this._isIPhoneX) {
        // consider iphone x global and iphone x gsm
        this._isIPhoneX = name.indexOf('iPhone10,3') === 0 || name.indexOf('iPhone10,6') === 0;
      }
    }
  }
}

const rootVC = function() {
  const appWindow = UIApplication.sharedApplication.keyWindow;
  return appWindow.rootViewController;
};

const createButton = function(
  target: any,
  frame: CGRect,
  label: string,
  eventName: string,
  align?: string,
  img?: UIImage,
  imgSelected?: UIImage
): UIButton {
  let btn: UIButton;
  if (frame) {
    btn = UIButton.alloc().initWithFrame(frame);
  } else {
    btn = UIButton.alloc().init();
  }
  if (label) {
    btn.setTitleForState(label, UIControlState.Normal);
    btn.setTitleColorForState(new Color('#fff').ios, UIControlState.Normal);
    btn.titleLabel.font = UIFont.systemFontOfSize(19);
  } else if (img) {
    btn.setImageForState(img, UIControlState.Normal);
    if (imgSelected) {
      btn.setImageForState(img, UIControlState.Highlighted);
      btn.setImageForState(img, UIControlState.Selected);
    }
  }
  if (align) {
    btn.contentHorizontalAlignment =
      align === 'right' ? UIControlContentHorizontalAlignment.Right : UIControlContentHorizontalAlignment.Left;
    // if (align == 'right') {
    //   btn.contentEdgeInsets = UIEdgeInsetsMake(0, 10, 0, 0);
    // }
  }
  if (eventName) {
    btn.addTargetActionForControlEvents(target, eventName, UIControlEvents.TouchUpInside);
  }
  return btn;
};

const addShadow = function(button: UIButton) {
  button.layer.shadowColor = UIColor.blackColor.CGColor;
  button.layer.shadowOffset = CGSizeMake(0, 0);
  button.layer.shadowRadius = 5;
  button.layer.shadowOpacity = 1;
};

const createIcon = function(
  type: 'flash' | 'flashOff' | 'toggle' | 'picOutline' | 'takePic' | 'gallery',
  size?: CGSize,
  color?: string
) {
  switch (type) {
    case 'flash':
      UIGraphicsBeginImageContextWithOptions(size || CGSizeMake(50, 50), false, 0);
      drawFlash(color);
      break;
    case 'flashOff':
      UIGraphicsBeginImageContextWithOptions(size || CGSizeMake(50, 50), false, 0);
      drawFlashOff(color);
      break;
    case 'toggle':
      UIGraphicsBeginImageContextWithOptions(size || CGSizeMake(50, 50), false, 0);
      drawToggle(color);
      break;
    case 'picOutline':
      UIGraphicsBeginImageContextWithOptions(size || CGSizeMake(50, 50), false, 0);
      drawPicOutline(color);
      break;
    case 'takePic':
      UIGraphicsBeginImageContextWithOptions(size || CGSizeMake(50, 50), false, 0);
      drawCircle(color);
      break;
    case 'gallery':
      UIGraphicsBeginImageContextWithOptions(size || CGSizeMake(50, 50), false, 0);
      drawGallery(color);
      break;
  }
  const img = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  return img;
};

const drawFlash = function(color: string) {
  const iconColor = new Color(color || '#fff').ios;

  //// Bezier Drawing
  const bezierPath = UIBezierPath.bezierPath();
  bezierPath.moveToPoint(CGPointMake(23.17, 0.58));
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(11.19, 13.65),
    CGPointMake(22.79, 0.97),
    CGPointMake(17.38, 6.83)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(0, 26.66),
    CGPointMake(3.2, 22.41),
    CGPointMake(-0.07, 26.24)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(6.91, 27.44),
    CGPointMake(0.1, 27.26),
    CGPointMake(0.34, 27.29)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(13.61, 28.15),
    CGPointMake(13.34, 27.58),
    CGPointMake(13.71, 27.61)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(10.61, 37.07),
    CGPointMake(13.54, 28.45),
    CGPointMake(12.18, 32.46)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(7.83, 45.92),
    CGPointMake(9.02, 41.64),
    CGPointMake(7.76, 45.62)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(8.85, 46.43),
    CGPointMake(7.89, 46.25),
    CGPointMake(8.27, 46.43)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(21.54, 33.48),
    CGPointMake(9.59, 46.43),
    CGPointMake(11.36, 44.63)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(33.2, 19.87),
    CGPointMake(30.18, 23.97),
    CGPointMake(33.27, 20.35)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(26.57, 19.12),
    CGPointMake(33.1, 19.21),
    CGPointMake(33, 19.21)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(20, 18.67),
    CGPointMake(21.71, 19.06),
    CGPointMake(20, 18.94)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(22.76, 9.88),
    CGPointMake(20, 18.49),
    CGPointMake(21.23, 14.52)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(25.38, 0.73),
    CGPointMake(24.26, 5.21),
    CGPointMake(25.45, 1.12)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(23.17, 0.58),
    CGPointMake(25.24, -0.17),
    CGPointMake(24.05, -0.26)
  );
  bezierPath.miterLimit = 4;
  bezierPath.closePath();
  iconColor.setFill();
  bezierPath.fill();
};

const drawFlashOff = function(color: string) {
  const iconColor = new Color(color || '#fff').ios;

  //// Bezier Drawing
  const bezierPath = UIBezierPath.bezierPath();
  bezierPath.moveToPoint(CGPointMake(21.13, 4.5));
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(15.1, 12.28),
    CGPointMake(19.18, 7.01),
    CGPointMake(16.45, 10.51)
  );
  bezierPath.addLineToPoint(CGPointMake(12.66, 15.45));
  bezierPath.addLineToPoint(CGPointMake(7.09, 9.64));
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(0.8, 3.9),
    CGPointMake(2.5, 4.82),
    CGPointMake(1.41, 3.84)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(0, 4.73),
    CGPointMake(0.29, 3.96),
    CGPointMake(0.06, 4.2)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(17.83, 24.13),
    CGPointMake(-0.06, 5.36),
    CGPointMake(2.7, 8.39)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(36.44, 42.69),
    CGPointMake(32.87, 39.81),
    CGPointMake(35.86, 42.78)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(37.21, 41.88),
    CGPointMake(36.89, 42.63),
    CGPointMake(37.15, 42.36)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(31.64, 35.24),
    CGPointMake(37.3, 41.28),
    CGPointMake(36.29, 40.11)
  );
  bezierPath.addLineToPoint(CGPointMake(25.98, 29.31));
  bezierPath.addLineToPoint(CGPointMake(29.34, 24.94));
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(32.62, 19.91),
    CGPointMake(31.76, 21.83),
    CGPointMake(32.67, 20.39)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(27.02, 19.16),
    CGPointMake(32.53, 19.25),
    CGPointMake(32.44, 19.25)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(21.48, 18.71),
    CGPointMake(22.91, 19.1),
    CGPointMake(21.48, 18.98)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(23.8, 9.91),
    CGPointMake(21.48, 18.53),
    CGPointMake(22.51, 14.55)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(26.01, 0.75),
    CGPointMake(25.07, 5.24),
    CGPointMake(26.07, 1.14)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(25.3, 0.01),
    CGPointMake(25.96, 0.34),
    CGPointMake(25.7, 0.07)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(21.13, 4.5),
    CGPointMake(24.81, -0.08),
    CGPointMake(23.97, 0.84)
  );
  bezierPath.miterLimit = 4;
  bezierPath.closePath();
  iconColor.setFill();
  bezierPath.fill();

  // other half
  const bezier2Path = UIBezierPath.bezierPath();
  bezier2Path.moveToPoint(CGPointMake(7.18, 22.6));
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(4.59, 26.7),
    CGPointMake(5.43, 24.91),
    CGPointMake(4.54, 26.32)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(10.42, 27.48),
    CGPointMake(4.68, 27.3),
    CGPointMake(4.91, 27.33)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(16.08, 28.2),
    CGPointMake(15.85, 27.63),
    CGPointMake(16.17, 27.66)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(13.55, 37.12),
    CGPointMake(16.02, 28.5),
    CGPointMake(14.87, 32.51)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(11.2, 45.98),
    CGPointMake(12.2, 41.7),
    CGPointMake(11.14, 45.68)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(12.06, 46.49),
    CGPointMake(11.26, 46.31),
    CGPointMake(11.57, 46.49)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(18.06, 39.67),
    CGPointMake(12.69, 46.49),
    CGPointMake(13.61, 45.47)
  );
  bezier2Path.addLineToPoint(CGPointMake(23.29, 32.81));
  bezier2Path.addLineToPoint(CGPointMake(16.71, 25.96));
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(9.99, 19.1),
    CGPointMake(13.09, 22.19),
    CGPointMake(10.08, 19.1)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(7.18, 22.6),
    CGPointMake(9.91, 19.1),
    CGPointMake(8.64, 20.69)
  );
  bezier2Path.miterLimit = 4;
  bezier2Path.closePath();
  iconColor.setFill();
  bezier2Path.fill();
};

const drawToggle = function(color: string) {
  const iconColor = new Color(color || '#fff').ios;

  //// Bezier Drawing
  const bezierPath = UIBezierPath.bezierPath();
  bezierPath.moveToPoint(CGPointMake(17.91, 3.03));
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(14.69, 6.2),
    CGPointMake(16.11, 5.72),
    CGPointMake(15.7, 6.1)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(13.41, 5.51),
    CGPointMake(13.75, 6.31),
    CGPointMake(13.52, 6.17)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(9.1, 4.6),
    CGPointMake(13.3, 4.74),
    CGPointMake(13.15, 4.7)
  );
  bezierPath.addLineToPoint(CGPointMake(4.87, 4.5));
  bezierPath.addLineToPoint(CGPointMake(4.87, 5.4));
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(3.37, 6.27),
    CGPointMake(4.87, 6.2),
    CGPointMake(4.72, 6.27)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(0.94, 7.14),
    CGPointMake(2.25, 6.27),
    CGPointMake(1.61, 6.52)
  );
  bezierPath.addLineToPoint(CGPointMake(0, 7.98));
  bezierPath.addLineToPoint(CGPointMake(0, 26.59));
  bezierPath.addLineToPoint(CGPointMake(0, 45.2));
  bezierPath.addLineToPoint(CGPointMake(0.97, 46.04));
  bezierPath.addLineToPoint(CGPointMake(1.95, 46.88));
  bezierPath.addLineToPoint(CGPointMake(31.88, 46.88));
  bezierPath.addLineToPoint(CGPointMake(61.81, 46.88));
  bezierPath.addLineToPoint(CGPointMake(62.83, 45.9));
  bezierPath.addLineToPoint(CGPointMake(63.88, 44.96));
  bezierPath.addLineToPoint(CGPointMake(63.88, 26.52));
  bezierPath.addLineToPoint(CGPointMake(63.88, 8.09));
  bezierPath.addLineToPoint(CGPointMake(62.98, 7.18));
  bezierPath.addLineToPoint(CGPointMake(62.08, 6.27));
  bezierPath.addLineToPoint(CGPointMake(55.03, 6.27));
  bezierPath.addLineToPoint(CGPointMake(48.03, 6.27));
  bezierPath.addLineToPoint(CGPointMake(45.89, 3.14));
  bezierPath.addLineToPoint(CGPointMake(43.76, 0));
  bezierPath.addLineToPoint(CGPointMake(31.84, 0));
  bezierPath.addLineToPoint(CGPointMake(19.93, 0));
  bezierPath.addLineToPoint(CGPointMake(17.91, 3.03));
  bezierPath.closePath();
  bezierPath.moveToPoint(CGPointMake(44.92, 4.6));
  bezierPath.addLineToPoint(CGPointMake(46.94, 7.67));
  bezierPath.addLineToPoint(CGPointMake(54.13, 7.67));
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(61.74, 8.09),
    CGPointMake(59.19, 7.67),
    CGPointMake(61.44, 7.81)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(61.74, 44.89),
    CGPointMake(62.38, 8.68),
    CGPointMake(62.38, 44.3)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(1.95, 44.89),
    CGPointMake(61.1, 45.48),
    CGPointMake(2.58, 45.48)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(1.5, 26.63),
    CGPointMake(1.61, 44.57),
    CGPointMake(1.5, 40.04)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(2.1, 8.22),
    CGPointMake(1.5, 10.84),
    CGPointMake(1.57, 8.71)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(9.74, 7.67),
    CGPointMake(2.58, 7.77),
    CGPointMake(3.82, 7.67)
  );
  bezierPath.addLineToPoint(CGPointMake(16.78, 7.67));
  bezierPath.addLineToPoint(CGPointMake(17.65, 6.34));
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(19.74, 3.21),
    CGPointMake(18.13, 5.65),
    CGPointMake(19.07, 4.22)
  );
  bezierPath.addLineToPoint(CGPointMake(21.02, 1.39));
  bezierPath.addLineToPoint(CGPointMake(31.96, 1.46));
  bezierPath.addLineToPoint(CGPointMake(42.86, 1.57));
  bezierPath.addLineToPoint(CGPointMake(44.92, 4.6));
  bezierPath.miterLimit = 4;
  bezierPath.closePath();
  iconColor.setFill();
  bezierPath.fill();

  //// Bezier 2 Drawing
  const bezier2Path = UIBezierPath.bezierPath();
  bezier2Path.moveToPoint(CGPointMake(28.28, 11.26));
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(21.77, 14.43),
    CGPointMake(26.11, 11.78),
    CGPointMake(22.85, 13.38)
  );
  bezier2Path.addLineToPoint(CGPointMake(21.02, 15.16));
  bezier2Path.addLineToPoint(CGPointMake(22.1, 16.38));
  bezier2Path.addLineToPoint(CGPointMake(23.19, 17.6));
  bezier2Path.addLineToPoint(CGPointMake(24.24, 16.69));
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(31.84, 14.11),
    CGPointMake(26.41, 14.78),
    CGPointMake(28.4, 14.11)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(36.79, 14.95),
    CGPointMake(34.43, 14.11),
    CGPointMake(35.37, 14.29)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(42.56, 20.32),
    CGPointMake(39.22, 16.03),
    CGPointMake(41.47, 18.16)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(41.21, 23.35),
    CGPointMake(43.94, 23.14),
    CGPointMake(43.87, 23.35)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(38.96, 23.52),
    CGPointMake(39.97, 23.35),
    CGPointMake(38.96, 23.42)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(45.33, 30.84),
    CGPointMake(38.96, 23.87),
    CGPointMake(45.03, 30.84)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(51.7, 23.56),
    CGPointMake(45.67, 30.84),
    CGPointMake(51.7, 23.94)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(49.3, 23.35),
    CGPointMake(51.7, 23.45),
    CGPointMake(50.61, 23.35)
  );
  bezier2Path.addLineToPoint(CGPointMake(46.9, 23.35));
  bezier2Path.addLineToPoint(CGPointMake(46.64, 21.96));
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(38.03, 12.16),
    CGPointMake(45.93, 18.09),
    CGPointMake(42.41, 14.05)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(28.28, 11.26),
    CGPointMake(35.18, 10.91),
    CGPointMake(31.24, 10.56)
  );
  bezier2Path.miterLimit = 4;
  bezier2Path.closePath();
  iconColor.setFill();
  bezier2Path.fill();

  //// Bezier 3 Drawing
  const bezier3Path = UIBezierPath.bezierPath();
  bezier3Path.moveToPoint(CGPointMake(15.14, 20.91));
  bezier3Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(12.06, 24.74),
    CGPointMake(13.52, 22.83),
    CGPointMake(12.14, 24.54)
  );
  bezier3Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(14.35, 25.09),
    CGPointMake(11.99, 24.95),
    CGPointMake(12.89, 25.09)
  );
  bezier3Path.addLineToPoint(CGPointMake(16.75, 25.09));
  bezier3Path.addLineToPoint(CGPointMake(16.97, 27.08));
  bezier3Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(21.35, 34.99),
    CGPointMake(17.27, 29.76),
    CGPointMake(19.03, 33)
  );
  bezier3Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(41.81, 35.41),
    CGPointMake(27.24, 40.11),
    CGPointMake(36.11, 40.29)
  );
  bezier3Path.addLineToPoint(CGPointMake(43.46, 33.98));
  bezier3Path.addLineToPoint(CGPointMake(42.41, 32.83));
  bezier3Path.addLineToPoint(CGPointMake(41.36, 31.68));
  bezier3Path.addLineToPoint(CGPointMake(40.01, 32.86));
  bezier3Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(31.84, 35.72),
    CGPointMake(37.58, 34.99),
    CGPointMake(35.48, 35.72)
  );
  bezier3Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(26.82, 34.89),
    CGPointMake(29.22, 35.72),
    CGPointMake(28.32, 35.58)
  );
  bezier3Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(20.31, 26.91),
    CGPointMake(23.34, 33.28),
    CGPointMake(21.02, 30.43)
  );
  bezier3Path.addLineToPoint(CGPointMake(19.97, 25.09));
  bezier3Path.addLineToPoint(CGPointMake(22.37, 25.09));
  bezier3Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(24.58, 24.57),
    CGPointMake(24.39, 25.09),
    CGPointMake(24.76, 24.99)
  );
  bezier3Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(18.36, 17.43),
    CGPointMake(24.28, 23.84),
    CGPointMake(18.69, 17.43)
  );
  bezier3Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(15.14, 20.91),
    CGPointMake(18.21, 17.43),
    CGPointMake(16.78, 18.99)
  );
  bezier3Path.miterLimit = 4;
  bezier3Path.closePath();
  iconColor.setFill();
  bezier3Path.fill();
};

const drawPicOutline = function(color: string) {
  const iconColor = new Color(color || '#fff').ios;

  //// Bezier Drawing
  // Outer ring
  const bezierPath = UIBezierPath.bezierPath();
  bezierPath.moveToPoint(CGPointMake(17.13, 0.63));
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(6.13, 7.21),
    CGPointMake(12.82, 1.77),
    CGPointMake(9.31, 3.87)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(0.91, 15.85),
    CGPointMake(3.7, 9.79),
    CGPointMake(2.11, 12.44)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(0, 23.21),
    CGPointMake(0.1, 18.27),
    CGPointMake(0, 18.86)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(0.91, 30.58),
    CGPointMake(0, 27.57),
    CGPointMake(0.1, 28.19)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(14.02, 44.75),
    CGPointMake(3.11, 36.93),
    CGPointMake(8.01, 42.2)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(31.73, 44.75),
    CGPointMake(19.37, 47.05),
    CGPointMake(26.38, 47.05)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(44.84, 30.58),
    CGPointMake(37.74, 42.2),
    CGPointMake(42.64, 36.93)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(45.75, 23.21),
    CGPointMake(45.65, 28.19),
    CGPointMake(45.75, 27.57)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(44.84, 15.85),
    CGPointMake(45.75, 18.86),
    CGPointMake(45.65, 18.24)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(28, 0.46),
    CGPointMake(42.15, 8.12),
    CGPointMake(35.82, 2.33)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(17.13, 0.63),
    CGPointMake(25.15, -0.22),
    CGPointMake(20.02, -0.13)
  );
  bezierPath.closePath();
  bezierPath.moveToPoint(CGPointMake(27.39, 4.39));
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(42.02, 23.21),
    CGPointMake(35.82, 6.42),
    CGPointMake(42.02, 14.38)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(31.77, 40.33),
    CGPointMake(42.02, 30.35),
    CGPointMake(38, 37.06)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(9.38, 36.8),
    CGPointMake(24.21, 44.26),
    CGPointMake(15.48, 42.92)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(5.87, 14.28),
    CGPointMake(3.37, 30.84),
    CGPointMake(2.01, 22.04)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(18.2, 4.42),
    CGPointMake(8.14, 9.76),
    CGPointMake(13.3, 5.6)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(27.39, 4.39),
    CGPointMake(20.73, 3.8),
    CGPointMake(24.82, 3.8)
  );
  bezierPath.miterLimit = 4;
  bezierPath.closePath();
  iconColor.setFill();
  bezierPath.fill();

  // inner circle
  // let bezier2Path = UIBezierPath.bezierPath();
  // bezier2Path.moveToPoint(CGPointMake(17.88, 0.51));
  // bezier2Path.addCurveToPointControlPoint1ControlPoint2(CGPointMake(0, 23.08), CGPointMake(7.47, 3.09), CGPointMake(0.04, 12.49));
  // bezier2Path.addCurveToPointControlPoint1ControlPoint2(CGPointMake(17.83, 45.25), CGPointMake(0, 33.39), CGPointMake(7.47, 42.66));
  // bezier2Path.addCurveToPointControlPoint1ControlPoint2(CGPointMake(40.08, 39.13), CGPointMake(25.81, 47.22), CGPointMake(34.2, 44.92));
  // bezier2Path.addCurveToPointControlPoint1ControlPoint2(CGPointMake(47, 22.84), CGPointMake(44.9, 34.41), CGPointMake(47, 29.4));
  // bezier2Path.addCurveToPointControlPoint1ControlPoint2(CGPointMake(31.6, 1.29), CGPointMake(47, 13.03), CGPointMake(41.08, 4.82));
  // bezier2Path.addCurveToPointControlPoint1ControlPoint2(CGPointMake(17.88, 0.51), CGPointMake(27.99, -0.07), CGPointMake(21.65, -0.4));
  // bezier2Path.miterLimit = 4;
  // bezier2Path.closePath();
  // iconColor.setFill();
  // bezier2Path.fill();
};

const drawCircle = function(color: string) {
  const iconColor = new Color(color || '#fff').ios;

  // inner circle
  const bezier2Path = UIBezierPath.bezierPath();
  bezier2Path.moveToPoint(CGPointMake(17.88, 0.51));
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(0, 23.08),
    CGPointMake(7.47, 3.09),
    CGPointMake(0.04, 12.49)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(17.83, 45.25),
    CGPointMake(0, 33.39),
    CGPointMake(7.47, 42.66)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(40.08, 39.13),
    CGPointMake(25.81, 47.22),
    CGPointMake(34.2, 44.92)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(47, 22.84),
    CGPointMake(44.9, 34.41),
    CGPointMake(47, 29.4)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(31.6, 1.29),
    CGPointMake(47, 13.03),
    CGPointMake(41.08, 4.82)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(17.88, 0.51),
    CGPointMake(27.99, -0.07),
    CGPointMake(21.65, -0.4)
  );
  bezier2Path.miterLimit = 4;
  bezier2Path.closePath();
  iconColor.setFill();
  bezier2Path.fill();
};

const drawGallery = function(color: string) {
  const iconColor = new Color(color || '#fff').ios;

  //// Bezier Drawing
  const bezierPath = UIBezierPath.bezierPath();
  bezierPath.moveToPoint(CGPointMake(1.42, 0.13));
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(0.11, 1.46),
    CGPointMake(0.9, 0.31),
    CGPointMake(0.25, 0.98)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(0, 17.28),
    CGPointMake(0.03, 1.72),
    CGPointMake(0, 6.61)
  );
  bezierPath.addLineToPoint(CGPointMake(0, 32.73));
  bezierPath.addLineToPoint(CGPointMake(0.28, 33.24));
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(1.04, 34.04),
    CGPointMake(0.48, 33.61),
    CGPointMake(0.68, 33.83)
  );
  bezierPath.addLineToPoint(CGPointMake(1.52, 34.33));
  bezierPath.addLineToPoint(CGPointMake(3.84, 34.36));
  bezierPath.addLineToPoint(CGPointMake(6.15, 34.39));
  bezierPath.addLineToPoint(CGPointMake(6.15, 36.54));
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(6.8, 39.66),
    CGPointMake(6.15, 38.93),
    CGPointMake(6.18, 39.09)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(28.05, 40.3),
    CGPointMake(7.53, 40.35),
    CGPointMake(5.98, 40.3)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(48.38, 40.19),
    CGPointMake(42.82, 40.3),
    CGPointMake(48.05, 40.27)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(49.89, 38.82),
    CGPointMake(48.98, 40.04),
    CGPointMake(49.74, 39.36)
  );
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(50, 23),
    CGPointMake(49.97, 38.55),
    CGPointMake(50, 33.88)
  );
  bezierPath.addLineToPoint(CGPointMake(50, 7.54));
  bezierPath.addLineToPoint(CGPointMake(49.72, 7.04));
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(48.96, 6.23),
    CGPointMake(49.52, 6.66),
    CGPointMake(49.32, 6.44)
  );
  bezierPath.addLineToPoint(CGPointMake(48.48, 5.95));
  bezierPath.addLineToPoint(CGPointMake(46.17, 5.92));
  bezierPath.addLineToPoint(CGPointMake(43.86, 5.89));
  bezierPath.addLineToPoint(CGPointMake(43.83, 3.62));
  bezierPath.addLineToPoint(CGPointMake(43.8, 1.34));
  bezierPath.addLineToPoint(CGPointMake(43.53, 0.95));
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(42.79, 0.29),
    CGPointMake(43.38, 0.74),
    CGPointMake(43.05, 0.43)
  );
  bezierPath.addLineToPoint(CGPointMake(42.31, 0.02));
  bezierPath.addLineToPoint(CGPointMake(22.07, 0));
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(1.42, 0.13),
    CGPointMake(4.39, -0.01),
    CGPointMake(1.79, 0)
  );
  bezierPath.closePath();
  bezierPath.moveToPoint(CGPointMake(39.78, 4.9));
  bezierPath.addLineToPoint(CGPointMake(39.78, 5.9));
  bezierPath.addLineToPoint(CGPointMake(23.83, 5.9));
  bezierPath.addLineToPoint(CGPointMake(7.88, 5.9));
  bezierPath.addLineToPoint(CGPointMake(7.33, 6.16));
  bezierPath.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(6.5, 6.84),
    CGPointMake(6.98, 6.34),
    CGPointMake(6.7, 6.57)
  );
  bezierPath.addLineToPoint(CGPointMake(6.2, 7.26));
  bezierPath.addLineToPoint(CGPointMake(6.17, 18.86));
  bezierPath.addLineToPoint(CGPointMake(6.15, 30.46));
  bezierPath.addLineToPoint(CGPointMake(5.11, 30.46));
  bezierPath.addLineToPoint(CGPointMake(4.07, 30.46));
  bezierPath.addLineToPoint(CGPointMake(4.07, 17.18));
  bezierPath.addLineToPoint(CGPointMake(4.07, 3.89));
  bezierPath.addLineToPoint(CGPointMake(21.92, 3.89));
  bezierPath.addLineToPoint(CGPointMake(39.78, 3.89));
  bezierPath.addLineToPoint(CGPointMake(39.78, 4.9));
  bezierPath.closePath();
  bezierPath.moveToPoint(CGPointMake(45.93, 23.1));
  bezierPath.addLineToPoint(CGPointMake(45.93, 36.38));
  bezierPath.addLineToPoint(CGPointMake(28.08, 36.38));
  bezierPath.addLineToPoint(CGPointMake(10.22, 36.38));
  bezierPath.addLineToPoint(CGPointMake(10.22, 23.1));
  bezierPath.addLineToPoint(CGPointMake(10.22, 9.82));
  bezierPath.addLineToPoint(CGPointMake(28.08, 9.82));
  bezierPath.addLineToPoint(CGPointMake(45.93, 9.82));
  bezierPath.addLineToPoint(CGPointMake(45.93, 23.1));
  bezierPath.miterLimit = 4;
  bezierPath.closePath();
  iconColor.setFill();
  bezierPath.fill();

  //// Bezier 2 Drawing
  const bezier2Path = UIBezierPath.bezierPath();
  bezier2Path.moveToPoint(CGPointMake(17.8, 12.38));
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(15.42, 15.92),
    CGPointMake(16.27, 12.89),
    CGPointMake(15.26, 14.38)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(17.54, 18.78),
    CGPointMake(15.54, 17.16),
    CGPointMake(16.34, 18.25)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(18.95, 19.04),
    CGPointMake(18.02, 18.99),
    CGPointMake(18.24, 19.04)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(20.36, 18.78),
    CGPointMake(19.65, 19.04),
    CGPointMake(19.88, 18.99)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(20.99, 12.83),
    CGPointMake(22.9, 17.64),
    CGPointMake(23.25, 14.33)
  );
  bezier2Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(17.8, 12.38),
    CGPointMake(20.05, 12.21),
    CGPointMake(18.84, 12.03)
  );
  bezier2Path.miterLimit = 4;
  bezier2Path.closePath();
  iconColor.setFill();
  bezier2Path.fill();

  //// Bezier 3 Drawing
  const bezier3Path = UIBezierPath.bezierPath();
  bezier3Path.moveToPoint(CGPointMake(33.75, 17.49));
  bezier3Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(29.87, 22.24),
    CGPointMake(33.63, 17.56),
    CGPointMake(31.88, 19.7)
  );
  bezier3Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(25.94, 27.01),
    CGPointMake(27.58, 25.15),
    CGPointMake(26.12, 26.92)
  );
  bezier3Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(23.35, 24.83),
    CGPointMake(25.36, 27.29),
    CGPointMake(25.19, 27.13)
  );
  bezier3Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(21.52, 22.61),
    CGPointMake(22.42, 23.66),
    CGPointMake(21.6, 22.66)
  );
  bezier3Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(20.42, 22.78),
    CGPointMake(21.22, 22.43),
    CGPointMake(20.68, 22.52)
  );
  bezier3Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(12.62, 33.54),
    CGPointMake(20.22, 22.99),
    CGPointMake(15.01, 30.17)
  );
  bezier3Path.addLineToPoint(CGPointMake(12.29, 33.99));
  bezier3Path.addLineToPoint(CGPointMake(28.08, 33.99));
  bezier3Path.addLineToPoint(CGPointMake(43.85, 33.99));
  bezier3Path.addLineToPoint(CGPointMake(43.85, 31.58));
  bezier3Path.addLineToPoint(CGPointMake(43.84, 29.17));
  bezier3Path.addLineToPoint(CGPointMake(39.42, 23.53));
  bezier3Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(34.71, 17.62),
    CGPointMake(37, 20.42),
    CGPointMake(34.88, 17.78)
  );
  bezier3Path.addCurveToPointControlPoint1ControlPoint2(
    CGPointMake(33.75, 17.49),
    CGPointMake(34.39, 17.35),
    CGPointMake(34.11, 17.3)
  );
  bezier3Path.miterLimit = 4;
  bezier3Path.closePath();
  iconColor.setFill();
  bezier3Path.fill();
};

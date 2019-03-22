declare const enum CameraSelection {
  Rear = 0,

  Front = 1
}

declare class Orientation extends NSObject {
  static alloc(): Orientation; // inherited from NSObject

  static new(): Orientation; // inherited from NSObject

  readonly coreMotionManager: CMMotionManager;
}

declare class PreviewView extends UIView {
  static alloc(): PreviewView; // inherited from NSObject

  static appearance(): PreviewView; // inherited from UIAppearance

  static appearanceForTraitCollection(trait: UITraitCollection): PreviewView; // inherited from UIAppearance

  static appearanceForTraitCollectionWhenContainedIn(
    trait: UITraitCollection,
    ContainerClass: typeof NSObject
  ): PreviewView; // inherited from UIAppearance

  static appearanceForTraitCollectionWhenContainedInInstancesOfClasses(
    trait: UITraitCollection,
    containerTypes: NSArray<typeof NSObject> | typeof NSObject[]
  ): PreviewView; // inherited from UIAppearance

  static appearanceWhenContainedIn(ContainerClass: typeof NSObject): PreviewView; // inherited from UIAppearance

  static appearanceWhenContainedInInstancesOfClasses(
    containerTypes: NSArray<typeof NSObject> | typeof NSObject[]
  ): PreviewView; // inherited from UIAppearance

  static layerClass(): typeof NSObject;

  static new(): PreviewView; // inherited from NSObject

  session: AVCaptureSession;

  readonly videoPreviewLayer: AVCaptureVideoPreviewLayer;
}

declare const enum SessionSetupResult {
  Success = 0,

  NotAuthorized = 1,

  ConfigurationFailed = 2
}

declare class SwiftyCamButton extends UIButton {
  static alloc(): SwiftyCamButton; // inherited from NSObject

  static appearance(): SwiftyCamButton; // inherited from UIAppearance

  static appearanceForTraitCollection(trait: UITraitCollection): SwiftyCamButton; // inherited from UIAppearance

  static appearanceForTraitCollectionWhenContainedIn(
    trait: UITraitCollection,
    ContainerClass: typeof NSObject
  ): SwiftyCamButton; // inherited from UIAppearance

  static appearanceForTraitCollectionWhenContainedInInstancesOfClasses(
    trait: UITraitCollection,
    containerTypes: NSArray<typeof NSObject> | typeof NSObject[]
  ): SwiftyCamButton; // inherited from UIAppearance

  static appearanceWhenContainedIn(ContainerClass: typeof NSObject): SwiftyCamButton; // inherited from UIAppearance

  static appearanceWhenContainedInInstancesOfClasses(
    containerTypes: NSArray<typeof NSObject> | typeof NSObject[]
  ): SwiftyCamButton; // inherited from UIAppearance

  static buttonWithType(buttonType: UIButtonType): SwiftyCamButton; // inherited from UIButton

  static new(): SwiftyCamButton; // inherited from NSObject

  buttonEnabled: boolean;

  delegate: SwiftyCamButtonDelegate;
}

interface SwiftyCamButtonDelegate {
  buttonDidBeginLongPress(): void;

  buttonDidEndLongPress(): void;

  buttonWasTapped(): void;

  longPressDidReachMaximumDuration(): void;

  setMaxiumVideoDuration(): number;
}
declare var SwiftyCamButtonDelegate: {
  prototype: SwiftyCamButtonDelegate;
};

declare var SwiftyCamVersionNumber: number;

declare var SwiftyCamVersionString: interop.Reference<number>;

declare const enum SwiftyCamVideoGravity {
  Resize = 0,

  ResizeAspect = 1,

  ResizeAspectFill = 2
}

declare class SwiftyCamViewController extends UIViewController
  implements AVCaptureFileOutputRecordingDelegate, SwiftyCamButtonDelegate, UIGestureRecognizerDelegate {
  static alloc(): SwiftyCamViewController; // inherited from NSObject

  static deviceWithMediaTypePreferringPosition(mediaType: string, position: AVCaptureDevicePosition): AVCaptureDevice;

  static new(): SwiftyCamViewController; // inherited from NSObject

  allowAutoRotate: boolean;

  allowBackgroundAudio: boolean;

  audioEnabled: boolean;

  beginZoomScale: number;

  cameraDelegate: SwiftyCamViewControllerDelegate;

  readonly currentCamera: CameraSelection;

  defaultCamera: CameraSelection;

  disableAudio: boolean;

  doubleTapCameraSwitch: boolean;

  flashEnabled: boolean;

  flashView: UIView;

  isCameraTorchOn: boolean;

  readonly isSessionRunning: boolean;

  readonly isVideoRecording: boolean;

  lowLightBoost: boolean;

  maxZoomScale: number;

  maximumVideoDuration: number;

  movieFileOutput: AVCaptureMovieFileOutput;

  orientation: Orientation;

  outputFolder: string;

  readonly panGesture: UIPanGestureRecognizer;

  photoFileOutput: AVCaptureStillImageOutput;

  readonly pinchGesture: UIPinchGestureRecognizer;

  pinchToZoom: boolean;

  previewLayer: PreviewView;

  previousPanTranslation: number;

  readonly session: AVCaptureSession;

  readonly sessionQueue: NSObject;

  sessionRunning: boolean;

  setupResult: SessionSetupResult;

  shouldPrompToAppSettings: boolean;

  shouldUseDeviceOrientation: boolean;

  swipeToZoom: boolean;

  swipeToZoomInverted: boolean;

  tapToFocus: boolean;

  videoDevice: AVCaptureDevice;

  videoDeviceInput: AVCaptureDeviceInput;

  videoGravity: SwiftyCamVideoGravity;

  videoQuality: VideoQuality;

  zoomScale: number;

  readonly debugDescription: string; // inherited from NSObjectProtocol

  readonly description: string; // inherited from NSObjectProtocol

  readonly hash: number; // inherited from NSObjectProtocol

  readonly isProxy: boolean; // inherited from NSObjectProtocol

  readonly superclass: typeof NSObject; // inherited from NSObjectProtocol

  readonly; // inherited from NSObjectProtocol

  buttonDidBeginLongPress(): void;

  buttonDidEndLongPress(): void;

  buttonWasTapped(): void;

  captureOutputDidFinishRecordingToOutputFileAtURLFromConnectionsError(
    output: AVCaptureFileOutput,
    outputFileURL: NSURL,
    connections: NSArray<AVCaptureConnection> | AVCaptureConnection[],
    error: NSError
  ): void;

  captureOutputDidStartRecordingToOutputFileAtURLFromConnections(
    output: AVCaptureFileOutput,
    fileURL: NSURL,
    connections: NSArray<AVCaptureConnection> | AVCaptureConnection[]
  ): void;

  capturePhotoAsyncronouslyWithCompletionHandler(completionHandler: (p1: boolean) => void): void;

  changeFlashSettingsWithDeviceMode(device: AVCaptureDevice, mode: AVCaptureFlashMode): void;

  class(): typeof NSObject;

  conformsToProtocol(aProtocol: any /* Protocol */): boolean;

  disableFlash(): void;

  enableFlash(): void;

  gestureRecognizerShouldBeRequiredToFailByGestureRecognizer(
    gestureRecognizer: UIGestureRecognizer,
    otherGestureRecognizer: UIGestureRecognizer
  ): boolean;

  gestureRecognizerShouldBegin(gestureRecognizer: UIGestureRecognizer): boolean;

  gestureRecognizerShouldReceivePress(gestureRecognizer: UIGestureRecognizer, press: UIPress): boolean;

  gestureRecognizerShouldReceiveTouch(gestureRecognizer: UIGestureRecognizer, touch: UITouch): boolean;

  gestureRecognizerShouldRecognizeSimultaneouslyWithGestureRecognizer(
    gestureRecognizer: UIGestureRecognizer,
    otherGestureRecognizer: UIGestureRecognizer
  ): boolean;

  gestureRecognizerShouldRequireFailureOfGestureRecognizer(
    gestureRecognizer: UIGestureRecognizer,
    otherGestureRecognizer: UIGestureRecognizer
  ): boolean;

  isEqual(object: any): boolean;

  isKindOfClass(aClass: typeof NSObject): boolean;

  isMemberOfClass(aClass: typeof NSObject): boolean;

  longPressDidReachMaximumDuration(): void;

  performSelector(aSelector: string): any;

  performSelectorWithObject(aSelector: string, object: any): any;

  performSelectorWithObjectWithObject(aSelector: string, object1: any, object2: any): any;

  processPhoto(imageData: NSData): UIImage;

  promptToAppSettings(): void;

  respondsToSelector(aSelector: string): boolean;

  retainCount(): number;

  self(): this;

  setBackgroundAudioPreference(): void;

  setMaxiumVideoDuration(): number;

  startVideoRecording(): void;

  stopVideoRecording(): void;

  switchCamera(): void;

  takePhoto(): void;

  toggleFlash(): void;

  videoInputPresetFromVideoQualityWithQuality(quality: VideoQuality): string;
}

interface SwiftyCamViewControllerDelegate {
  swiftyCamDidBeginRecordingVideo(swiftyCam: SwiftyCamViewController, camera: CameraSelection): void;

  swiftyCamDidChangeZoomLevel(swiftyCam: SwiftyCamViewController, zoom: number): void;

  swiftyCamDidFailToConfigure(swiftyCam: SwiftyCamViewController): void;

  swiftyCamDidFailToRecordVideo(swiftyCam: SwiftyCamViewController, error: NSError): void;

  swiftyCamDidFinishProcessVideoAt(swiftyCam: SwiftyCamViewController, url: NSURL): void;

  swiftyCamDidFinishRecordingVideo(swiftyCam: SwiftyCamViewController, camera: CameraSelection): void;

  swiftyCamDidFocusAtPoint(swiftyCam: SwiftyCamViewController, point: CGPoint): void;

  swiftyCamDidSwitchCameras(swiftyCam: SwiftyCamViewController, camera: CameraSelection): void;

  swiftyCamDidTake(swiftyCam: SwiftyCamViewController, photo: UIImage): void;

  swiftyCamNotAuthorized(swiftyCam: SwiftyCamViewController): void;

  swiftyCamSessionDidStartRunning(swiftyCam: SwiftyCamViewController): void;

  swiftyCamSessionDidStopRunning(swiftyCam: SwiftyCamViewController): void;
}
declare var SwiftyCamViewControllerDelegate: {
  prototype: SwiftyCamViewControllerDelegate;
};

declare const enum VideoQuality {
  High = 0,

  Medium = 1,

  Low = 2,

  Resolution352x288 = 3,

  Resolution640x480 = 4,

  Resolution1280x720 = 5,

  Resolution1920x1080 = 6,

  Resolution3840x2160 = 7,

  Iframe960x540 = 8,

  Iframe1280x720 = 9
}

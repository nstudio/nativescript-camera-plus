declare module co {
  export module fitcom {
    export module fancycamera {
      export class BuildConfig {
        public static class: java.lang.Class<co.fitcom.fancycamera.BuildConfig>;
        public static DEBUG: boolean;
        public static APPLICATION_ID: string;
        public static BUILD_TYPE: string;
        public static FLAVOR: string;
        public static VERSION_CODE: number;
        public static VERSION_NAME: string;
        public constructor();
      }
    }
  }
}

declare module co {
  export module fitcom {
    export module fancycamera {
      export class Camera1 extends co.fitcom.fancycamera.CameraBase {
        public static class: java.lang.Class<co.fitcom.fancycamera.Camera1>;
        public setSaveToGallery(param0: boolean): void;
        public setDisableHEVC(param0: boolean): void;
        public setMaxVideoFrameRate(param0: number): void;
        public getDisableHEVC(): boolean;
        public setAutoFocus(param0: boolean): void;
        public setAutoSquareCrop(param0: boolean): void;
        public getMaxVideoFrameRate(): number;
        public setMaxAudioBitRate(param0: number): void;
        public getSaveToGallery(): boolean;
        public getMaxVideoBitrate(): number;
        public getAutoFocus(): boolean;
        public getMaxAudioBitRate(): number;
        public getNumberOfCameras(): number;
        public setMaxVideoBitrate(param0: number): void;
      }
    }
  }
}

declare module co {
  export module fitcom {
    export module fancycamera {
      export class Camera2 extends co.fitcom.fancycamera.CameraBase {
        public static class: java.lang.Class<co.fitcom.fancycamera.Camera2>;
        public setSaveToGallery(param0: boolean): void;
        public setDisableHEVC(param0: boolean): void;
        public setMaxVideoFrameRate(param0: number): void;
        public getDisableHEVC(): boolean;
        public setAutoFocus(param0: boolean): void;
        public setAutoSquareCrop(param0: boolean): void;
        public getMaxVideoFrameRate(): number;
        public setMaxAudioBitRate(param0: number): void;
        public getSaveToGallery(): boolean;
        public getMaxVideoBitrate(): number;
        public getAutoFocus(): boolean;
        public getMaxAudioBitRate(): number;
        public getNumberOfCameras(): number;
        public setMaxVideoBitrate(param0: number): void;
      }
    }
  }
}

declare module co {
  export module fitcom {
    export module fancycamera {
      export abstract class CameraBase {
        public static class: java.lang.Class<co.fitcom.fancycamera.CameraBase>;
        public static CameraThread: string;
        public getListener(): co.fitcom.fancycamera.CameraEventListener;
        public setSaveToGallery(param0: boolean): void;
        public setDisableHEVC(param0: boolean): void;
        public requestStoragePermission(): void;
        public setMaxVideoFrameRate(param0: number): void;
        public getHolder(): globalAndroid.view.TextureView;
        public setListener(param0: co.fitcom.fancycamera.CameraEventListener): void;
        public getDisableHEVC(): boolean;
        public setAutoFocus(param0: boolean): void;
        public setMaxAudioBitRate(param0: number): void;
        public setTextViewListener(param0: co.fitcom.fancycamera.TextViewListener): void;
        public hasStoragePermission(): boolean;
        public getAutoFocus(): boolean;
        public getNumberOfCameras(): number;
        public getTextViewListener(): co.fitcom.fancycamera.TextViewListener;
        public setMaxVideoBitrate(param0: number): void;
      }
    }
  }
}

declare module co {
  export module fitcom {
    export module fancycamera {
      export class CameraEventListener {
        public static class: java.lang.Class<co.fitcom.fancycamera.CameraEventListener>;
        /**
         * Constructs a new instance of the co.fitcom.fancycamera.CameraEventListener interface with the provided implementation. An empty constructor exists calling super() when extending the interface class.
         */
        public constructor(implementation: {
          onCameraOpen(): void;
          onCameraClose(): void;
          onPhotoEvent(param0: co.fitcom.fancycamera.PhotoEvent): void;
          onVideoEvent(param0: co.fitcom.fancycamera.VideoEvent): void;
        });
        public constructor();
        public onPhotoEvent(param0: co.fitcom.fancycamera.PhotoEvent): void;
        public onCameraClose(): void;
        public onVideoEvent(param0: co.fitcom.fancycamera.VideoEvent): void;
        public onCameraOpen(): void;
      }
    }
  }
}

declare module co {
  export module fitcom {
    export module fancycamera {
      export abstract class CameraEventListenerUI extends co.fitcom.fancycamera.CameraEventListener {
        public static class: java.lang.Class<co.fitcom.fancycamera.CameraEventListenerUI>;
        public onPhotoEvent(param0: co.fitcom.fancycamera.PhotoEvent): void;
        public onCameraCloseUI(): void;
        public onPhotoEventUI(param0: co.fitcom.fancycamera.PhotoEvent): void;
        public onCameraOpenUI(): void;
        public onVideoEvent(param0: co.fitcom.fancycamera.VideoEvent): void;
        public onCameraClose(): void;
        public onCameraOpen(): void;
        public constructor();
        public onVideoEventUI(param0: co.fitcom.fancycamera.VideoEvent): void;
      }
    }
  }
}

declare module co {
  export module fitcom {
    export module fancycamera {
      export class EventType {
        public static class: java.lang.Class<co.fitcom.fancycamera.EventType>;
        public static ERROR: co.fitcom.fancycamera.EventType;
        public static INFO: co.fitcom.fancycamera.EventType;
        public static values(): native.Array<co.fitcom.fancycamera.EventType>;
        public static valueOf(param0: string): co.fitcom.fancycamera.EventType;
      }
    }
  }
}

declare module co {
  export module fitcom {
    export module fancycamera {
      export class FancyCamera {
        public static class: java.lang.Class<co.fitcom.fancycamera.FancyCamera>;
        public onSurfaceTextureDestroyed(param0: globalAndroid.graphics.SurfaceTexture): boolean;
        public flashEnabled(): boolean;
        public requestStoragePermission(): void;
        public setDisableHEVC(param0: boolean): void;
        public setListener(param0: co.fitcom.fancycamera.CameraEventListener): void;
        public onSurfaceTextureAvailable(
          param0: globalAndroid.graphics.SurfaceTexture,
          param1: number,
          param2: number
        ): void;
        public getAutoFocus(): boolean;
        public setAutoFocus(param0: boolean): void;
        public setCameraPosition(param0: co.fitcom.fancycamera.FancyCamera.CameraPosition): void;
        public getDB(): number;
        public setSaveToGallery(param0: boolean): void;
        public constructor(param0: globalAndroid.content.Context, param1: globalAndroid.util.AttributeSet);
        public setMaxVideoFrameRate(param0: number): void;
        public setFile(param0: java.io.File): void;
        public getAmplitude(): number;
        public takePhoto(): void;
        public requestPermission(): void;
        public setCameraPosition(param0: number): void;
        public getMaxVideoFrameRate(): number;
        public enableFlash(): void;
        public getSaveToGallery(): boolean;
        public getMaxVideoBitrate(): number;
        public getCameraPosition(): number;
        public onSurfaceTextureSizeChanged(
          param0: globalAndroid.graphics.SurfaceTexture,
          param1: number,
          param2: number
        ): void;
        public getAmplitudeEMA(): number;
        public setCameraOrientation(param0: co.fitcom.fancycamera.FancyCamera.CameraOrientation): void;
        public cameraStarted(): boolean;
        public getDuration(): number;
        public startRecording(): void;
        public getDisableHEVC(): boolean;
        public hasPermission(): boolean;
        public toggleFlash(): void;
        public constructor(param0: globalAndroid.content.Context);
        public start(): void;
        public cameraRecording(): boolean;
        public stopRecording(): void;
        public setMaxVideoBitrate(param0: number): void;
        public deInitListener(): void;
        public release(): void;
        public setQuality(param0: number): void;
        public setCameraOrientation(param0: number): void;
        public getCameraOrientation(): number;
        public setMaxAudioBitRate(param0: number): void;
        public stop(): void;
        public onSurfaceTextureUpdated(param0: globalAndroid.graphics.SurfaceTexture): void;
        public disableFlash(): void;
        public hasFlash(): boolean;
        public toggleCamera(): void;
        public hasStoragePermission(): boolean;
        public getMaxAudioBitRate(): number;
        public getNumberOfCameras(): number;
      }
      export module FancyCamera {
        export class CameraOrientation {
          public static class: java.lang.Class<co.fitcom.fancycamera.FancyCamera.CameraOrientation>;
          public static UNKNOWN: co.fitcom.fancycamera.FancyCamera.CameraOrientation;
          public static PORTRAIT: co.fitcom.fancycamera.FancyCamera.CameraOrientation;
          public static PORTRAIT_UPSIDE_DOWN: co.fitcom.fancycamera.FancyCamera.CameraOrientation;
          public static LANDSCAPE_LEFT: co.fitcom.fancycamera.FancyCamera.CameraOrientation;
          public static LANDSCAPE_RIGHT: co.fitcom.fancycamera.FancyCamera.CameraOrientation;
          public getValue(): number;
          public static valueOf(param0: string): co.fitcom.fancycamera.FancyCamera.CameraOrientation;
          public static values(): native.Array<co.fitcom.fancycamera.FancyCamera.CameraOrientation>;
        }
        export class CameraPosition {
          public static class: java.lang.Class<co.fitcom.fancycamera.FancyCamera.CameraPosition>;
          public static BACK: co.fitcom.fancycamera.FancyCamera.CameraPosition;
          public static FRONT: co.fitcom.fancycamera.FancyCamera.CameraPosition;
          public getValue(): number;
          public static values(): native.Array<co.fitcom.fancycamera.FancyCamera.CameraPosition>;
          public static valueOf(param0: string): co.fitcom.fancycamera.FancyCamera.CameraPosition;
        }
        export class Quality {
          public static class: java.lang.Class<co.fitcom.fancycamera.FancyCamera.Quality>;
          public static MAX_480P: co.fitcom.fancycamera.FancyCamera.Quality;
          public static MAX_720P: co.fitcom.fancycamera.FancyCamera.Quality;
          public static MAX_1080P: co.fitcom.fancycamera.FancyCamera.Quality;
          public static MAX_2160P: co.fitcom.fancycamera.FancyCamera.Quality;
          public static HIGHEST: co.fitcom.fancycamera.FancyCamera.Quality;
          public static LOWEST: co.fitcom.fancycamera.FancyCamera.Quality;
          public static QVGA: co.fitcom.fancycamera.FancyCamera.Quality;
          public getValue(): number;
          public static valueOf(param0: string): co.fitcom.fancycamera.FancyCamera.Quality;
          public static values(): native.Array<co.fitcom.fancycamera.FancyCamera.Quality>;
        }
      }
    }
  }
}

declare module co {
  export module fitcom {
    export module fancycamera {
      export class PhotoEvent {
        public static class: java.lang.Class<co.fitcom.fancycamera.PhotoEvent>;
        public getFile(): java.io.File;
        public getMessage(): string;
        public getType(): co.fitcom.fancycamera.EventType;
      }
      export module PhotoEvent {
        export class EventError {
          public static class: java.lang.Class<co.fitcom.fancycamera.PhotoEvent.EventError>;
          public static UNKNOWN: co.fitcom.fancycamera.PhotoEvent.EventError;
          public static values(): native.Array<co.fitcom.fancycamera.PhotoEvent.EventError>;
          public static valueOf(param0: string): co.fitcom.fancycamera.PhotoEvent.EventError;
        }
        export class EventInfo {
          public static class: java.lang.Class<co.fitcom.fancycamera.PhotoEvent.EventInfo>;
          public static PHOTO_TAKEN: co.fitcom.fancycamera.PhotoEvent.EventInfo;
          public static UNKNOWN: co.fitcom.fancycamera.PhotoEvent.EventInfo;
          public static values(): native.Array<co.fitcom.fancycamera.PhotoEvent.EventInfo>;
          public static valueOf(param0: string): co.fitcom.fancycamera.PhotoEvent.EventInfo;
        }
      }
    }
  }
}

declare module co {
  export module fitcom {
    export module fancycamera {
      export class TextViewListener {
        public static class: java.lang.Class<co.fitcom.fancycamera.TextViewListener>;
        /**
         * Constructs a new instance of the co.fitcom.fancycamera.TextViewListener interface with the provided implementation. An empty constructor exists calling super() when extending the interface class.
         */
        public constructor(implementation: {
          onSurfaceTextureAvailable(
            param0: globalAndroid.graphics.SurfaceTexture,
            param1: number,
            param2: number
          ): void;
          onSurfaceTextureSizeChanged(
            param0: globalAndroid.graphics.SurfaceTexture,
            param1: number,
            param2: number
          ): void;
          onSurfaceTextureDestroyed(param0: globalAndroid.graphics.SurfaceTexture): void;
          onSurfaceTextureUpdated(param0: globalAndroid.graphics.SurfaceTexture): void;
        });
        public constructor();
        public onSurfaceTextureAvailable(
          param0: globalAndroid.graphics.SurfaceTexture,
          param1: number,
          param2: number
        ): void;
        public onSurfaceTextureUpdated(param0: globalAndroid.graphics.SurfaceTexture): void;
        public onSurfaceTextureDestroyed(param0: globalAndroid.graphics.SurfaceTexture): void;
        public onSurfaceTextureSizeChanged(
          param0: globalAndroid.graphics.SurfaceTexture,
          param1: number,
          param2: number
        ): void;
      }
    }
  }
}

declare module co {
  export module fitcom {
    export module fancycamera {
      export class VideoEvent {
        public static class: java.lang.Class<co.fitcom.fancycamera.VideoEvent>;
        public getFile(): java.io.File;
        public getMessage(): string;
        public getType(): co.fitcom.fancycamera.EventType;
      }
      export module VideoEvent {
        export class EventError {
          public static class: java.lang.Class<co.fitcom.fancycamera.VideoEvent.EventError>;
          public static SERVER_DIED: co.fitcom.fancycamera.VideoEvent.EventError;
          public static UNKNOWN: co.fitcom.fancycamera.VideoEvent.EventError;
          public static values(): native.Array<co.fitcom.fancycamera.VideoEvent.EventError>;
          public static valueOf(param0: string): co.fitcom.fancycamera.VideoEvent.EventError;
        }
        export class EventInfo {
          public static class: java.lang.Class<co.fitcom.fancycamera.VideoEvent.EventInfo>;
          public static RECORDING_STARTED: co.fitcom.fancycamera.VideoEvent.EventInfo;
          public static RECORDING_FINISHED: co.fitcom.fancycamera.VideoEvent.EventInfo;
          public static MAX_DURATION_REACHED: co.fitcom.fancycamera.VideoEvent.EventInfo;
          public static MAX_FILESIZE_APPROACHING: co.fitcom.fancycamera.VideoEvent.EventInfo;
          public static MAX_FILESIZE_REACHED: co.fitcom.fancycamera.VideoEvent.EventInfo;
          public static NEXT_OUTPUT_FILE_STARTED: co.fitcom.fancycamera.VideoEvent.EventInfo;
          public static UNKNOWN: co.fitcom.fancycamera.VideoEvent.EventInfo;
          public static valueOf(param0: string): co.fitcom.fancycamera.VideoEvent.EventInfo;
          public static values(): native.Array<co.fitcom.fancycamera.VideoEvent.EventInfo>;
        }
      }
    }
  }
}

//Generics information:

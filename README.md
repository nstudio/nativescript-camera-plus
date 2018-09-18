<a align="center" href="https://www.npmjs.com/package/@nstudio/nativescript-camera-plus">
    <h3 align="center">NativeScript Camera Plus</h3>
</a>
<h4 align="center">A NativeScript camera with all the bells and whistles which can be embedded inside a view. This plugin was sponsored by LiveShopper</h4>

<p align="center">
<a href="https://liveshopper.com">
    <img align="center" src="./src/logos/liveshopper.png" alt="LiveShopper Logo"/>
    <a>
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/@nstudio/nativescript-camera-plus">
        <img src="https://img.shields.io/npm/v/@nstudio/nativescript-camera-plus.svg" alt="npm">
    </a>
    <a href="https://www.npmjs.com/package/@nstudio/nativescript-camera-plus">
        <img src="https://img.shields.io/npm/dt/@nstudio/nativescript-camera-plus.svg?label=npm%20downloads" alt="npm">
    </a>
    <a href="https://github.com/nstudio/nativescript-camera-plus/stargazers">
        <img src="https://img.shields.io/github/stars/nstudio/nativescript-camera-plus.svg" alt="stars">
    </a>
     <a href="https://github.com/nstudio/nativescript-camera-plus/network">
        <img src="https://img.shields.io/github/forks/nstudio/nativescript-camera-plus.svg" alt="forks">
    </a>
    <a href="https://github.com/nstudio/nativescript-camera-plus/blob/master/LICENSE.md">
        <img src="https://img.shields.io/github/license/nstudio/nativescript-camera-plus.svg" alt="license">
    </a>
</p>

<p align="center">
    <a align="center" href="http://nstudio.io">
      <img src="./images/nstudio-banner.png" alt="nStudio banner">
    </a>
    <h5 align="center">Do you need assistance on your project or plugin? Contact the nStudio team anytime at <a href="mailto:team@nstudio.io">team@nstudio.io</a> to get up to speed with the best practices in mobile and web app development.
    </h5>
</p>

---

## Installation

```bash
tns plugin add @nstudio/nativescript-camera-plus
```

## Sample

_Yes the camera is rotated because it's a webcam to an emulator and it's just the way life works_

![Camera Plus](images/camplus1.gif)

## Demo

The demo apps work best when run on a real device.
You can launch them from the simulator/emulator however the camera does not work on iOS simulators. Android emulators will work with cameras if you enable your webcam.

### Android Emulator Note

The camera in your webcam being used on emulators will likely be rotated sideways (incorrectly). The actual camera output will be correctly oriented, it's only the preview on emulators that present the preview incorrectly. This issue shouldn't be present on real devices due to the camera being oriented correctly on the device vs. a webcam in a computer.

NOTE: You may want to run: `npm run nuke` first to clear and reset directories.

### Run Vanilla Demo

Plug device in, then:

```bash
npm run demo.ios.device
// or...
npm run demo.android.device
```

### Run Angular Demo

Plug device in, then:

```bash
npm run demo.ng.ios.device
// or...
npm run demo.ng.android.device
```

## Properties

| Name                  | Type    | Description                                                                                                                            |
| --------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **debug**             | boolean | If true logs will be output in the console to help debug the Camera Plus events.                                                       |
| **confirmPhotos**     | boolean | If true the default take picture event will present a confirmation dialog before saving. Default is true.                              |
| **confirmRetakeText** | string | When confirming capture this text will be presented to the user to retake the photo. Default is 'Retake'                                |
| **confirmSaveText**   | string | When confirming capture this text will be presented to the user to save the photo. Default is 'Save'                                    |
| **saveToGallery**     | boolean | If true the default take picture event will save to device gallery. Default is true.                                                   |
| **galleryPickerMode** | string  | The gallery/library selection mode. 'single' allows one image to be selected. 'multiple' allows multiple images. Default is 'multiple' |
| **showFlashIcon**     | boolean | If true the default flash toggle icon/button will show on the Camera Plus layout. Default is true.                                     |
| **showToggleIcon**    | boolean | If true the default camera toggle (front/back) icon button will show on the Camera Plus layout. Default is true.                       |
| **showCaptureIcon**   | boolean | If true the default capture (take picture) icon/button will show on the Camera Plus layout. Default is true.                           |
| **showGalleryIcon**   | boolean | If true the choose from gallery/library icon/button will show on the Camera Plus layout. Default is true.                              |
| **enableVideo**       | boolean | If true the CameraPlus instance can record video.                                                                                      |

## Static Properties
_Note: These properties need set before the initialization of the camera. Users should set these in a component constructor before their view creates the component if the wish to change the default values._

| Name               | Type        | Description                                                                                                                                      |
| ------------------ | ----------  | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **enableVideo**    | boolean     | Video Support (off by default). Can reset it before using in different views if they want to go back/forth between photo/camera and video/camera |
| **defaultCamera**  | CameraTypes | Defaults the camera correctly on launch. Default `'rear'`. `'front'` or `'rear'`                                                                 |

## Android Only Properties

| Name                 | Type    | Description                                                                                 |
| -------------------- | ------- | ------------------------------------------------------------------------------------------- |
| **flashOnIcon**      | string  | Name of app_resource drawable for the native image button when flash is on (enabled).       |
| **flashOffIcon**     | string  | Name of app_resource drawable for the native image button when flash is off (disabled).     |
| **toggleCameraIcon** | string  | Name of app_resource drawable for the toggle camera button.                                 |
| **takePicIcon**      | string  | Name of app_resource drawable for the take picture (capture) button.                        |
| **galleryIcon**      | string  | Name of app_resource drawable for the open gallery (image library) button.                  |
| **autoFocus**        | boolean | If true the camera will use continuous focus when the camera detects changes of the target. |

## iOS Only Properties

| Name                      | Type    | Description                                                   |
| ------------------------- | ------- | ------------------------------------------------------------- |
| **doubleTapCameraSwitch** | boolean | Enable/disable double tap gesture to switch camera. (enabled) |

## Cross Platform Public Methods

| Method                                       | Description                                                                                                                                                 |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **isCameraAvailable()**                      | Returns true if the device has at least one camera.                                                                                                         |
| **toggleFlash()**                            | Toggles the flash mode on the active camera.                                                                                                                |
| **toggleCamera()**                           | Toggles the active camera on the device.                                                                                                                    |
| **chooseFromLibrary(opts?: IChooseOptions)** | Opens the device gallery (image library) for selecting images.                                                                                              |
| **takePicture(opts?: ICaptureOptions)**      | Takes a picture of the current preview in the CameraPlus.                                                                                                   |
| **getFlashMode(): string**                   | Android: various strings possible: https://developer.android.com/reference/android/hardware/Camera.Parameters.html#getFlashMode() iOS: either `'on'` or `'off'` |
| **record(opts?: IVideoOptions)**             | Starts recording a video.                                                                                                                                   |
| **stop()**                                   | Stops the video recording, when stopped the `videoRecordingReadyEvent` event will be emitted.                                                               |

## Android Only Public Methods

| Method                                                  | Description                                                                                                                                       |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **requestCameraPermissions(explanationText?: string)**  | Prompts the user to grant runtime permission to use the device camera. Returns a Promise<boolean>.                                                  |
| **hasCameraPermission()**                               | Returns true if the application has been granted access to the device camera.                                                                       |
| **requestStoragePermissions(explanationText?: string)** | Prompts the user to grant runtime permission to use external storage for saving and opening images from device gallery. Returns a Promise<boolean>. |
| **hasStoragePermissions()**                             | Returns true if the application has been granted access to the device storage.                                                                      |
| **getNumberOfCameras()**                                | Returns the number of cameras on the device.                                                                                                        |
| **hasFlash()**                                          | Returns true if the active camera has a flash mode.                                                                                                 |

## Events

| Name                    | Description                                                        |
| ----------------------- | ------------------------------------------------------------------ |
| **errorEvent**          | Executes when an error is emitted from CameraPlus                   |
| **photoCapturedEvent**  | Executes when a photo is taken.                                    |
| **toggleCameraEvent**   | Executes when the device camera is toggled.                        |
| **imagesSelectedEvent** | Executes when images are selected from the device library/gallery. |
| **videoRecordingStartedEvent** | Executes when video starts recording. |
| **videoRecordingFinishedEvent** | Executes when video stops recording but has not process yet. |
| **videoRecordingReadyEvent** | Executes when video has completed processing and is ready to be used. |
| **confirmScreenShownEvent** | Executes when  the picture confirm dialog is shown.. |
| **confirmScreenDismissedEvent** | Executes when the picture confirm dialog is dismissed either by Retake or Save button. |


## Option Interfaces
```TS
export interface ICameraOptions {
  confirm?: boolean;
  saveToGallery?: boolean;
  keepAspectRatio?: boolean;
  height?: number;
  width?: number;
  autoSquareCrop?: boolean;
  confirmRetakeText?: string;
  confirmSaveText?: string;
}
```
```TS
export interface IChooseOptions {
  width?: number;
  height?: number;
  keepAspectRatio?: boolean;
}
```

```TS
export interface IVideoOptions {
  confirm?: boolean;
  saveToGallery?: boolean;
  height?: number;
  width?: number;
}
```

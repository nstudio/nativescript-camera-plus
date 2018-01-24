# NativeScript Camera Plus

[![nStudio Plugin](https://img.shields.io/badge/nStudio-Plugin-orange.svg)](http://nstudio.io)
[![npm](https://img.shields.io/npm/v/@nstudio/nativescript-camera-plus.svg)](https://www.npmjs.com/package/@nstudio/nativescript-camera-plus)
[![npm](https://img.shields.io/npm/dt/@nstudio/nativescript-camera-plus.svg?label=npm%20downloads)](https://www.npmjs.com/package/@nstudio/nativescript-camera-plus)

A NativeScript camera with all the bells and whistles which can be embedded inside a view. This plugin was sponsored by [LiveShopper](https://liveshopper.com).

[![LiveShopper](./src/logos/liveshopper.svg "LiveShopper")](https://liveshopper.com/).

## Installation

```bash
tns plugin add @nstudio/nativescript-camera-plus
```

## Sample 
 - Yes the camera is rotated because it's a webcam and it's just the way life works.

![Camera Plus](screens/camplus1.gif)

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
| **saveToGallery**     | boolean | If true the default take picture event will save to device gallery. Default is true.                                                   |
| **galleryPickerMode** | string  | The gallery/library selection mode. 'single' allows one image to be selected. 'multiple' allows multiple images. Default is 'multiple' |
| **showFlashIcon**     | boolean | If true the default flash toggle icon/button will show on the Camera Plus layout. Default is true.                                     |
| **showToggleIcon**    | boolean | If true the default camera toggle (front/back) icon button will show on the Camera Plus layout. Default is true.                       |
| **showCaptureIcon**   | boolean | If true the default capture (take picture) icon/button will show on the Camera Plus layout. Default is true.                           |
| **showGalleryIcon**   | boolean | If true the choose from gallery/library icon/button will show on the Camera Plus layout. Default is true.                              |

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
| **takePicture()**                            | Takes a picture of the current preview in the CameraPlus.                                                                                                   |
| **getFlashMode(): string**                   | Android: various strings possible: https://developer.android.com/reference/android/hardware/Camera.Parameters.html#getFlashMode() iOS: either 'on' or 'off' |

## Android Only Public Methods

| Method                                                  | Description                                                                                                                                         |
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
| **photoCapturedEvent**  | Executes when a photo is taken.                                    |
| **toggleCameraEvent**   | Executes when the device camera is toggled.                        |
| **imagesSelectedEvent** | Executes when images are selected from the device library/gallery. |

---

## [nStudio, LLC](http://nstudio.io)

[![nStudio](./src/logos/nstudio-banner.png "nStudio")](http://nStudio.io)

Do you need assistance on your project or plugin? Contact the nStudio team anytime at [team@nstudio.io](<mailto:team@nstudio.io>)

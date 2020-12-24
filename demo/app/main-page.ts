import * as observable from '@nativescript/core/data/observable';
import * as pages from '@nativescript/core/ui/page';
import { CameraPlus } from '@nstudio/nativescript-camera-plus';
import { HelloWorldModel } from './main-view-model';

// Event handler for Page 'loaded' event attached in main-page.xml
export function pageLoaded(args: observable.EventData) {
    // Get the event sender
    const page = <pages.Page>args.object;
    page.bindingContext = new HelloWorldModel(page);
}

export function camLoaded(args: any) {
    const cam = args.object as CameraPlus;
    console.log(`cam loaded event`);
    const handle = () => {
        console.log('sizes', cam.getAvailablePictureSizes('16:9'));
        cam.autoFocus = true;
        try {
            const flashMode = args.object.getFlashMode();
            console.log(`flashMode in loaded event = ${flashMode}`);
        } catch (e) {
            console.log(e);
        }
    };
    if (!cam.hasCameraPermission()) {
        cam.requestCameraPermissions()
            .then(() => handle());
    } else {
        handle();
    }
}

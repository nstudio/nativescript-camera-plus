import { EventData, Page } from '@nativescript/core';
import { HelloWorldModel } from './main-view-model';

// Event handler for Page 'loaded' event attached in main-page.xml
export function pageLoaded(args: EventData) {
  // Get the event sender
  const page = args.object as Page;
  page.bindingContext = new HelloWorldModel(page);
}

export function camLoaded(args: any) {
  console.info('cam loaded event');

  try {
    const flashMode = args.object.getFlashMode();
    console.info(`flashMode in loaded event = ${flashMode}`);
  } catch (e) {
    console.error(e);
  }
}

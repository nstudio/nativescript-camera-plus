import * as observable from 'tns-core-modules/data/observable';
import * as pages from 'tns-core-modules/ui/page';
import { HelloWorldModel } from './main-view-model';

// Event handler for Page 'loaded' event attached in main-page.xml
export function pageLoaded(args: observable.EventData) {
  // Get the event sender
  let page = <pages.Page>args.object;
  page.bindingContext = new HelloWorldModel(page);
}

export function camLoaded(args: any) {
  console.log(`cam loaded event`);

  try {
    const flashMode = args.object.getFlashMode();
    console.log(`flashMode in loaded event = ${flashMode}`);
  } catch (e) {
    console.log(e);
  }
}

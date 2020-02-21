import { Component } from '@angular/core';
import { registerElement } from '@nativescript/angular/element-registry';
import { CameraPlus } from '@nstudio/nativescript-camera-plus';
registerElement('CameraPlus', () => <any>CameraPlus);

@Component({
  selector: 'ns-app',
  templateUrl: 'app.component.html'
})
export class AppComponent {}

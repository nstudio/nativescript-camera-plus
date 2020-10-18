import { Component } from '@angular/core';
import { registerElement } from '@nativescript/angular';
import { CameraPlus } from '@nstudio/nativescript-camera-plus';

registerElement('CameraPlus', () => CameraPlus);

@Component({
  selector: 'ns-app',
  templateUrl: 'app.component.html',
})
export class AppComponent {}

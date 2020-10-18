import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from '@nativescript/angular';
import { CaptureComponent } from './capture/capture.component';

const routes: Routes = [
  { path: '', redirectTo: '/capture', pathMatch: 'full' },
  { path: 'capture', component: CaptureComponent },
];

@NgModule({
  imports: [NativeScriptRouterModule.forRoot(routes)],
  exports: [NativeScriptRouterModule],
})
export class AppRoutingModule {}

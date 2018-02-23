import { NgModule } from "@angular/core";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import { Routes } from "@angular/router";

import { CaptureComponent } from "./capture/capture.component";

const routes: Routes = [
    { path: "", redirectTo: "/capture", pathMatch: "full" },
    { path: "capture", component: CaptureComponent }
];

@NgModule({
    imports: [NativeScriptRouterModule.forRoot(routes)],
    exports: [NativeScriptRouterModule]
})
export class AppRoutingModule { }
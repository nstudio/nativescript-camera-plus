import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { Item } from "./item";
import { ItemService } from "./item.service";

import { CameraPlus } from "nativescript-camera-plus";
import { fromAsset } from "tns-core-modules/image-source";

@Component({
  selector: "ns-details",
  moduleId: module.id,
  templateUrl: "./item-detail.component.html"
})
export class ItemDetailComponent implements OnInit {
  item: Item;
  //   private _cam: CameraPlus;
  @ViewChild("camPlus") camPlus: ElementRef;

  constructor(
    private itemService: ItemService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.params["id"];
    this.item = this.itemService.getItem(id);
    this.camPlus.nativeElement.on(CameraPlus.photoCapturedEvent, args => {
      console.log(args);
      fromAsset(args.data)
        .then(res => {
          console.log("res", res);
        })
        .catch(err => {
          console.log("err", err);
        });
    });
  }
}

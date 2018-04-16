import * as app from 'tns-core-modules/application';
import { ImageAsset } from 'tns-core-modules/image-asset';
import { CLog } from './camera-plus.common';

/**
 * Helper method to get the drawable of an app_resource icon for the ImageButtons 'image'
 * @param iconName
 */
export function getImageDrawable(iconName: string) {
  const drawableId = app.android.context
    .getResources()
    .getIdentifier(iconName, 'drawable', app.android.context.getPackageName()) as number;
  return drawableId;
}

/**
 * Helper method to create android ImageButton
 */
export function createImageButton(): android.widget.ImageButton {
  const btn = new android.widget.ImageButton(app.android.context) as android.widget.ImageButton;
  btn.setPadding(24, 24, 24, 24);
  btn.setMaxHeight(48);
  btn.setMaxWidth(48);
  return btn;
}

/**
 * Creates a new rounded GradientDrawable with transparency and rounded corners.
 */
export function createTransparentCircleDrawable(): android.graphics.drawable.GradientDrawable {
  const shape = new android.graphics.drawable.GradientDrawable();
  shape.setColor(0x99000000);
  shape.setCornerRadius(96);
  shape.setAlpha(160);
  return shape;
}

/**
 * Create date time stamp similar to Java Date()
 */
export function createDateTimeStamp() {
  let result = '';
  const date = new Date();
  result =
    date.getFullYear().toString() +
    (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1).toString() : (date.getMonth() + 1).toString()) +
    (date.getDate() < 10 ? '0' + date.getDate().toString() : date.getDate().toString()) +
    '_' +
    date.getHours().toString() +
    date.getMinutes().toString() +
    date.getSeconds().toString();
  return result;
}

/**
 * Creates an ImageAsset from a file path
 * @param path
 * @param width
 * @param height
 * @param keepAspectRatio
 */
export function assetFromPath(path, width, height, keepAspectRatio): ImageAsset {
  const asset = new ImageAsset(path);
  asset.options = {
    width,
    height,
    keepAspectRatio
  };
  return asset;
}

/**
 * Helper method to get the optimal sizing for the preview from the camera.
 * Android cameras support different sizes for previewing.
 * @param sizes
 * @param width
 * @param height
 */
export function getOptimalPreviewSize(
  sizes: java.util.List,
  width: number,
  height: number
): android.hardware.Camera.Size {
  const ASPECT_TOLERANCE = 0.1;
  const targetRatio = height / width;
  CLog(`targetRatio = ${targetRatio}`);

  if (sizes === null) return null;

  let optimalSize = null as android.hardware.Camera.Size;
  let minDiff = Number.MAX_SAFE_INTEGER;

  const targetHeight = height;
  CLog(`targetHeight = ${targetHeight}`);

  for (var i = 0; i < sizes.size(); i++) {
    const element = sizes.get(i) as android.hardware.Camera.Size;
    CLog(`size.width = ${element.width}, size.height = ${element.height}`);
    const ratio = element.width / element.height;
    CLog(`ratio = ${ratio}`);
    if (Math.abs(ratio - targetRatio) > ASPECT_TOLERANCE) continue;
    if (Math.abs(element.height - targetHeight) < minDiff) {
      optimalSize = element;
      minDiff = Math.abs(element.height - targetHeight);
    }
  }

  if (optimalSize === null) {
    // minDiff = Double.MAX_VALUE;
    minDiff = Number.MAX_SAFE_INTEGER;
    for (var i = 0; i < sizes.size(); i++) {
      const element = sizes.get(i) as android.hardware.Camera.Size;
      CLog(`size.width = ${element.width}, size.height = ${element.height}`);
      if (Math.abs(element.height - targetHeight) < minDiff) {
        optimalSize = element;
        minDiff = Math.abs(element.height - targetHeight);
      }
    }
  }
  CLog(
    `optimalSize = ${optimalSize}, optimalSize.width = ${optimalSize.width}, optimalSize.height = ${optimalSize.height}`
  );
  return optimalSize;
}

export function calculateInSampleSize(
  options: android.graphics.BitmapFactory.Options,
  reqWidth: number,
  reqHeight: number
) {
  // Raw height and width of image
  let height = options.outHeight;
  let width = options.outWidth;
  let inSampleSize = 1;

  if (height > reqHeight || width > reqWidth) {
    let halfHeight = height / 2;
    let halfWidth = width / 2;

    // Calculate the largest inSampleSize value that is a power of 2 and keeps both
    // height and width larger than the requested height and width.
    while (halfHeight / inSampleSize >= reqHeight && halfWidth / inSampleSize >= reqWidth) {
      inSampleSize *= 2;
    }
  }

  return inSampleSize;
}

/* Returns the exif data from the camera byte array */
export function getOrientationFromBytes(data): number {
  // We won't auto-rotate the front Camera image
  const inputStream = new java.io.ByteArrayInputStream(data);
  let exif;
  if (android.os.Build.VERSION.SDK_INT >= 24) {
    exif = new android.media.ExifInterface(inputStream as any);
  } else {
    exif = new (android.support as any).media.ExifInterface(inputStream);
  }
  let orientation = exif.getAttributeInt(
    android.media.ExifInterface.TAG_ORIENTATION,
    android.media.ExifInterface.ORIENTATION_UNDEFINED
  );
  try {
    inputStream.close();
  } catch (ex) {
    CLog('byteArrayInputStream.close error', ex);
  }
  if (this.cameraId === 1) {
    if (orientation === 1) {
      orientation = 2;
    } else if (orientation === 3) {
      orientation = 4;
    } else if (orientation === 6) {
      orientation = 7;
    }
  }

  CLog('Orientation: ', orientation);
  return orientation;
}

export function createImageConfirmationDialog(data): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      debugger;
      const alert = new android.app.AlertDialog.Builder(
        app.android.foregroundActivity
      ) as android.app.AlertDialog.Builder;
      alert.setOnDismissListener(
        new android.content.DialogInterface.OnDismissListener({
          onDismiss: dialog => {
            resolve(false);
          }
        })
      );

      const layout = new android.widget.LinearLayout(app.android.context) as android.widget.LinearLayout;
      layout.setOrientation(1);

      // - Brad - working on OOM issue - use better Bitmap creation
      // https://developer.android.com/topic/performance/graphics/load-bitmap.html
      const bitmapFactoryOpts = new android.graphics.BitmapFactory.Options();
      bitmapFactoryOpts.inJustDecodeBounds = true;
      let picture = android.graphics.BitmapFactory.decodeByteArray(data, 0, data.length, bitmapFactoryOpts);

      bitmapFactoryOpts.inSampleSize = calculateInSampleSize(bitmapFactoryOpts, 300, 300);

      // decode with inSampleSize set now
      bitmapFactoryOpts.inJustDecodeBounds = false;

      picture = android.graphics.BitmapFactory.decodeByteArray(data, 0, data.length, bitmapFactoryOpts);

      const img = new android.widget.ImageView(app.android.context);

      img.setImageBitmap(picture);
      layout.addView(img);
      alert.setView(layout);
      alert.setNegativeButton(
        'Retake',
        new android.content.DialogInterface.OnClickListener({
          onClick: (dialog, which) => {
            resolve(false);
          }
        })
      );

      alert.setPositiveButton(
        'Save',
        new android.content.DialogInterface.OnClickListener({
          onClick: (dialog, which) => {
            resolve(true);
          }
        })
      );
      alert.show();
    } catch (err) {
      reject(err);
    }
  });
}

var CameraPlus = require('@nstudio/nativescript-camera-plus').CameraPlus;
var cameraPlus = new CameraPlus();

// TODO replace 'functionname' with an acual function name of your plugin class and run with 'npm test <platform>'
describe('functionname', function() {
  it('exists', function() {
    expect(cameraPlus.functionname).toBeDefined();
  });

  it('returns a promise', function() {
    expect(cameraPlus.functionname()).toEqual(jasmine.any(Promise));
  });
});

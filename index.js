let Service = null;
let Characteristic = null;
let CurrentDoorState = null;

const PLUGIN_NAME = "homebridge-http-garage-door";
const ACCESSORY_NAME = "garage-door";

module.exports = function(homebridge) {
  Characteristic = homebridge.hap.Characteristic;
  Service = homebridge.hap.Service;

  // Required Characteristics
  CurrentDoorState = Characteristic.CurrentDoorState;
  TargetDoorState = Characteristic.TargetDoorState;
  //ObstructionDetected = Characteristic.ObstructionDetected;

  homebridge.registerAccessory(
    PLUGIN_NAME,
    ACCESSORY_NAME,
    GarageDoorAccessory
  );
};

class GarageDoorAccessory {
  constructor(log, config) {
    this.log = log;
    this.name = config.name;

    this.service = new Service.GarageDoorOpener(this.name);
    this.service.setCharacteristic(CurrentDoorState, CurrentDoorState.CLOSED);
    this.service.setCharacteristic(TargetDoorState, TargetDoorState.CLOSED);

    this.service
      .getCharacteristic(CurrentDoorState)
      .on("get", this._getCurrentDoorState.bind(this));
    this.service
      .getCharacteristic(TargetDoorState)
      .on("get", this._getTargetDoorState.bind(this))
      .on("set", this._setTargetDoorState.bind(this));
    this.service
      .getCharacteristic(ObstructionDetected)
      .on("get", this._getObstructionDetected.bind(this));

    const { Manufacturer, Model, SerialNumber } = Characteristic;
    this.informationService = new Service.AccessoryInformation();
    this.informationService
      .setCharacteristic(Manufacturer, "Generic")
      .setCharacteristic(Model, "HTTP Door Opener")
      .setCharacteristic(SerialNumber, "0000");
  }

  getServices() {
    return [this.informationService, this.service];
  }

  _getCurrentDoorState(callback) {
    this.log("Getting current door state...");
    callback(null, this.service.getCharacteristic(CurrentDoorState).value);
  }

  _getTargetDoorState(callback) {
    this.log("Getting target door state...");
    callback(null, this.service.getCharacteristic(TargetDoorState).value);
  }

  _setTargetDoorState(value, callback) {
    this.log(`Setting target door state to "${value}"...`);
    this.service.getCharacteristic(TargetDoorState).updateValue(value);
    this.service.getCharacteristic(CurrentDoorState).updateValue(value);
    // .updateValue(CurrentDoorState.OPENING)
    // .updateValue(CurrentDoorState.CLOSING)
    callback(null, value);
  }

  //_getObstructionDetected(callback) {
  //  this.log("Getting if obstruction is detected...");
  //  callback(null, ObstructionDetected.NO);
  //}
}
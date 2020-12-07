/* jshint node: true */
"use strict";
var Service;
var Characteristic;
var DoorState;
        
module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  DoorState = homebridge.hap.Characteristic.CurrentDoorState;

  homebridge.registerAccessory("homebridge-http-garage-door", "HTTPGarageDoor", HTTPGarageDoorAccessory);
};

function getVal(config, key, defaultVal) {
    var val = config[key];
    if (val === null) {
        this.log("WARN: ${key} is a mandatory parameter!");
        return defaultVal;
    }
    return val;
}


function HTTPGarageDoorAccessory(log, config) {
  
    this.log = log;
    this.version = require('./package.json').version;
    log("HTTPGarageDoorAccessory version " + this.version);
  
    this.name = config.name;
    
    this.activateURL = getVal(config, "activateURL", "http://pigate.local/activate");
    this.statusURL = getVal(config, "statusURL", "http://pigate.local/status");

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
    //this.service
    //  .getCharacteristic(ObstructionDetected)
    //  .on("get", this._getObstructionDetected.bind(this));

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

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

    this.initService();
}

HTTPGarageDoorAccessory.prototype = {
        
          initService: function() {
            this.garageDoorOpener = new Service.GarageDoorOpener(this.name,this.name);
            this.currentDoorState = this.garageDoorOpener.getCharacteristic(DoorState);
            this.currentDoorState.on('get', this.getState.bind(this));
            this.targetDoorState = this.garageDoorOpener.getCharacteristic(Characteristic.TargetDoorState);
            this.targetDoorState.on('set', this.setState.bind(this));
            this.targetDoorState.on('get', this.getTargetState.bind(this));
            
            this.service = new Service.AccessoryInformation();
            this.service
              .setCharacteristic(Characteristic.Manufacturer, "PlasmaSoft")
              .setCharacteristic(Characteristic.Model, "Generic HTTP Garage Door")
              .setCharacteristic(Characteristic.SerialNumber, "Version 1.0.0");

            //GET INITIAL DOOR STATE
                  
            this.log("Initial Door State: " + (isClosed ? "CLOSED" : "OPEN"));
            this.currentDoorState.updateValue(isClosed ? DoorState.CLOSED : DoorState.OPEN);
            this.targetDoorState.updateValue(isClosed ? DoorState.CLOSED : DoorState.OPEN);
          },
     
        getTargetState: function(callback) {
    callback(null, this.targetState);
        },
setState: function(state, callback) {
    this.log("Setting state to " + state);
    this.targetState = state;
    var isClosed = this.isClosed();
    if ((state == DoorState.OPEN && isClosed) || (state == DoorState.CLOSED && !isClosed)) {
        this.log("Triggering GarageDoor Relay");
        this.operating = true;
        if (state == DoorState.OPEN) {
            this.currentDoorState.updateValue(DoorState.OPENING);
        } else {
            this.currentDoorState.updateValue(DoorState.CLOSING);
        }
	     setTimeout(this.setFinalDoorState.bind(this), this.doorOpensInSeconds * 1000);
	     this.switchOn();
    }

    callback();
    return true;
  },

  getState: function(callback) {
    var isClosed = this.isClosed();
    var isOpen = this.isOpen();
    var state = isClosed ? DoorState.CLOSED : isOpen ? DoorState.OPEN : DoorState.STOPPED;
    this.log("GarageDoor is " + (isClosed ? "CLOSED ("+DoorState.CLOSED+")" : isOpen ? "OPEN ("+DoorState.OPEN+")" : "STOPPED (" + DoorState.STOPPED + ")")); 
    callback(null, state);
  },

  getServices: function() {
    return [this.service, this.garageDoorOpener];
  }
};

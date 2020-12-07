/* jshint node: true */
"use strict";
var Service;
var Characteristic;
var DoorState;

const http = require('http');

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    DoorState = homebridge.hap.Characteristic.CurrentDoorState;
    
    homebridge.registerAccessory("homebridge-http-garage-door", "HTTPGarageDoor", HTTPGarageDoorAccessory);
};

/*
 function getVal(config, key, defaultVal) {
 var val = config[key];
 if (val === null) {
 this.log("WARN: ${key} is a mandatory parameter!");
 return defaultVal;
 }
 return val;
 }
 */

function HTTPGarageDoorAccessory(log, config) {
    
    this.log = log;
    this.version = require('./package.json').version;
    log("HTTPGarageDoorAccessory version " + this.version);
    
    this.name = config.name;
    
    this.activateURL = config['activateURL'];
    this.statusURL = config['statusURL'];
    this.sensorPollInMs = 4000;
    
    log("activateURL: " + this.activateURL);
    log("  statusURL: " + this.statusURL);
    
    this.initService();
}


HTTPGarageDoorAccessory.prototype = {
        
    monitorDoorState: function() {
  
        let req = http.get(this.statusURL, res => {
            let recv_data = '';
            res.on('data', chunk => { recv_data += chunk});
            res.on('end', () => {
                // recv_data contains state info.... {"currentState":"Closed"}
                let state = JSON.parse(recv_data).currentState;
                let newState = DoorState.STOPPED;
                if (state == "Open") {
                  newState = DoorState.OPEN;
                } else if (state == "Opening") {
                  newState = DoorState.OPENING;
                } else if (state == "Closed") {
                  newState = DoorState.CLOSED;
                } else if (state == "Closing") {
                  newState = DoorState.CLOSING;
                }
                
                if (this.currentState != newState){
                    this.log('Status update from Gate: ' + state);
                    this.currentState = newState;
                    this.currentDoorState.updateValue(this.currentState);
                }
                setTimeout(this.monitorDoorState.bind(this), this.sensorPollInMs);
                return state;
            });
        });
        req.on('error', err => {
            this.currentState = DoorState.STOPPED;
            this.log("Error in monitorDoorState: "+ err.message);

            setTimeout(this.monitorDoorState.bind(this), this.sensorPollInMs);
            return err.message;
        })
    },
    
    activateDoor: function() {
      
        let req = http.get(this.activateURL, res => {
            let recv_data = '';
            res.on('data', chunk => { recv_data += chunk});
            res.on('end', () => {
                // recv_data contains state info.... {"result":"Success"}
                let result = JSON.parse(recv_data).result;
                this.log('Activate Gate Request: ' + result);

            });
        });
        req.on('error', err => {
            this.log("Error in activateDoor: "+ err.message);
        })
        
    },
   
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
        
        //Set all states to closed
        this.currentState = DoorState.CLOSED;
        this.targetState = DoorState.CLOSED; 
        this.currentStateString = "Closed";
        this.log("Setting Initial Door State: " + this.currentStateString);

        this.currentDoorState.updateValue(this.currentState);
        this.targetDoorState.updateValue(this.currentState);
        
        //Trigger Monitoring
        this.currentStateString = this.monitorDoorState();
    },
    
    getTargetState: function(callback) {
        
        //GET DOOR STATE
        //var state = monitorDoorState();
        this.log("getTargetState: " + state);
        callback(null, this.targetState);
    },
    
    setState: function(state, callback) {
        this.log("setState to " + state);
        activateDoor();
        this.targetState = state;
        this.targetDoorState.updateValue(this.targetState);
        
        /*
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
        */
        
        callback();
        return true;
    },
    
    getState: function(callback) {
        /*
        var isClosed = this.isClosed();
        var isOpen = this.isOpen();
        var state = isClosed ? DoorState.CLOSED : isOpen ? DoorState.OPEN : DoorState.STOPPED;
        this.log("GarageDoor is " + (isClosed ? "CLOSED ("+DoorState.CLOSED+")" : isOpen ? "OPEN ("+DoorState.OPEN+")" : "STOPPED (" + DoorState.STOPPED + ")"));
        */
        var state = monitorDoorState();
        this.log("getState: " + state);
        
        callback(null, this.currentState);
    },
    
    getServices: function() {
        return [this.service, this.garageDoorOpener];
    }
};

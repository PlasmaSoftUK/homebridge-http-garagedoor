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

function HTTPGarageDoorAccessory(log, config) {
    
    this.log = log;
    this.version = require('./package.json').version;
    log("HTTPGarageDoorAccessory version " + this.version);
    
    this.name = config.name;
    
    this.activateURL = config['activateURL'];
    this.statusURL = config['statusURL'];
    this.statusPollInMs = config['statusPollInMs'];
    
    log("          name: " + this.name);
    log("   activateURL: " + this.activateURL);
    log("     statusURL: " + this.statusURL);
    log("statusPollInMs: " + this.statusPollInMs);
    
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
                    this.log(this.name + ' status update: ' + state);
                    this.currentState = newState;
                    this.currentDoorState.updateValue(this.currentState);
                    
                    //Check if Door is changing state from external activation if so update target state
                    if(this.initialising && newState == DoorState.OPEN){
                        //We have initialised and the door is already open update target state
                        this.log(this.name + ' Initial Status is now Open');
                        this.targetState = DoorState.OPEN;
                        this.targetDoorState.updateValue(this.targetState);                   
                    } else if(this.targetState == DoorState.OPEN && newState == DoorState.CLOSING) {
                        this.log(this.name + ' was Open but now Closing');
                        this.targetState = DoorState.CLOSED;
                        this.targetDoorState.updateValue(this.targetState); 
                    } else if(this.targetState == DoorState.CLOSED && newState == DoorState.OPENING) {
                        this.log(this.name + ' was Closed but now Opening');
                        this.targetState = DoorState.OPEN;
                        this.targetDoorState.updateValue(this.targetState); 
                    }
                }
                
                //Clear initialising flag first time this runs
                this.initialising = false;
                
                setTimeout(this.monitorDoorState.bind(this), this.statusPollInMs);
                return state;
            });
        });
        req.on('error', err => {
            this.currentState = DoorState.STOPPED;
            this.log("Error in monitorDoorState: "+ err.message);

            setTimeout(this.monitorDoorState.bind(this), this.statusPollInMs);
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
                this.log('Activate ' + this.name + ' request: ' + result);

            });
        });
        req.on('error', err => {
            this.log("Error in activateDoor: "+ err.message);
        })
        
    },
   
    doorStateToString: function(state) {
        switch (state) {
          case DoorState.OPEN:
            return "OPEN";
          case DoorState.OPENING:
            return "OPENING";     
          case DoorState.CLOSED:
            return "CLOSED";
          case DoorState.CLOSING:
            return "CLOSING";
          case DoorState.STOPPED:
            return "STOPPED";
          default:
            return "UNKNOWN";
        }
    },
    
    initService: function() {
        this.garageDoorOpener = new Service.GarageDoorOpener(this.name,this.name);
        
        this.currentDoorState = this.garageDoorOpener.getCharacteristic(DoorState);
        this.currentDoorState.on('get', this.getState.bind(this));
        
        this.targetDoorState = this.garageDoorOpener.getCharacteristic(Characteristic.TargetDoorState);
        this.targetDoorState.on('set', this.setTargetState.bind(this));
        this.targetDoorState.on('get', this.getTargetState.bind(this));
        
        this.service = new Service.AccessoryInformation();
        this.service
        .setCharacteristic(Characteristic.Manufacturer, "PlasmaSoft")
        .setCharacteristic(Characteristic.Model, "Generic HTTP Garage Door")
        .setCharacteristic(Characteristic.SerialNumber, "Version 1.0.0");
        
        //For an unknown reason the very first status lookup fails
        //Setting an init variable so we know we have just started and can set the states correctly
        this.initialising = true;
        
        //Set all states to closed
        this.currentState = DoorState.CLOSED;
        this.targetState = DoorState.CLOSED; 
        this.currentStateString = "Closed";
        this.log(" Initial State: Closed");

        this.currentDoorState.updateValue(this.currentState);
        this.targetDoorState.updateValue(this.targetState);
        
        //Trigger Monitoring
        this.currentStateString = this.monitorDoorState();
    },
    
    getTargetState: function(callback) {
        
        //GET DOOR STATE
        //this.log(this.name + " getTargetState: " + this.doorStateToString(this.targetState));
        callback(null, this.targetState);
    },
    
    setTargetState: function(state, callback) {
        if(this.currentState != state){
            this.log(this.name + "   currentState: " + this.doorStateToString(this.currentState));
            this.log(this.name + " setTargetState: " + this.doorStateToString(state));           
            this.activateDoor();
            this.targetState = state;
            this.targetDoorState.updateValue(this.targetState);
        }
        
        callback();
        return true;
    },
    
    getState: function(callback) {

        //this.log(this.name + " getState: " + this.doorStateToString(this.currentState));
        
        callback(null, this.currentState);
    },
    
    getServices: function() {
        return [this.service, this.garageDoorOpener];
    }
};

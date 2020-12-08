# homebridge-http-garagedoor
A Homebridge Plugin to control a Garage Door / Gate via HTTP commands

References:
  
  https://github.com/senscho/homebridge-tutorial
  
  https://github.com/benlamonica/homebridge-rasppi-gpio-garagedoor



I have a rPi Controlling my Gate via a web server which also allows me to integrate to Alexa.
I would ideally like this integrated in to Homekit too, hence this plugin.

The aim is to have the plugin call the same web service that Alexa uses to control the gate:

http://127.0.0.1:4283/activate

http://127.0.0.1:4283/activate

Then push that back in to HomeKit, and keep in sync if I use the manual controls or Alexa.



# Install

sudo npm install -g https://github.com/PlasmaSoftUK/homebridge-http-garagedoor.git


Then in your config.json add this accessory:

```
{
    "accessory": "HTTPGarageDoor",
    "name": "Front Gate",
    "activateURL": "http://127.0.0.1:4283/activate",
    "statusURL": "http://127.0.0.1:4283/activate",
    "statusPollInMs": 4000
}
```

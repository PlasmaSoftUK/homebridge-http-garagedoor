# homebridge-http-garagedoor
A Homebridge Plugin to control a Garage Door / Gate via HTTP commands

References:

  https://blog.theodo.com/2017/08/make-siri-perfect-home-companion-devices-not-supported-apple-homekit/
  
  https://github.com/senscho/homebridge-tutorial

  https://gist.github.com/ptz0n/4dcaff1b2fbfbe03415d1cd1b63bc108


A work in progress because I can't find an alternative plugin that will work

I have a rPi Controlling my Gate via a web server which also allows me to integrate to Alexa.
I would ideally like this integrated in to Homekit too, hence this plugin

The aim is to have the plugin call the web service that Alexa use to control the gate:

http://pigate.local/activate

http://pigate.local/status

Then push that back in to Homekit.



# Install

sudo npm install -g https://github.com/PlasmaSoftUK/homebridge-http-garagedoor.git

```
{
    "accessory": "HTTPGarageDoor",
    "name": "Front Gate",
    "statusURL": "http://pigate.local/status",
    "activateURL": "http://pigate.local/activate"
}
```

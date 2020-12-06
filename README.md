# homebridge-http-garagedoor
A Homebridge Plugin to control a Garage Door / Gate via HTTP commands

A work in progress because I can't find an alternative plugin that will work

I have a rPi Controlling my Gate via a web server which also allows me to integrate to Alexa.
I would ideally like this integrated in to Homekit too, hence this plugin

The aim is to have the plugin call the web service that Alexa use to control the gate:

http://pigate.local/open

http://pigate.local/close

http://pigate.local/status

Then push that back in to Homekit.

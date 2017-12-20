// animera.js
// This code was created by the open energy playground project 2016.

var Controller = require('./modules/Controller')
var Time = require('./Timeseries/Time')

var Animera = module.exports = function () {
  this.datasources = {
    appserver: require('./datasources/AppServer')
  }
  this.controllers = []
  this.times = {}
}

Animera.prototype.getTime = function (name) {
   if (typeof(this.times[name]) === 'undefined')
    this.times[name] = new Time()

  return this.times[name]
}

Animera.prototype.getController = function (url, sourcetype) {
  // If no type of source is specified, assume that we are looking for an Op-En App server
  // TODO: add mqtt websockets
  sourcetype = sourcetype || 'appserver'

  if (sourcetype == "app") {
    sourcetype="appserver"
    if (url.indexOf("://") < 0)
      url = "http://" +url
  }

  if (sourcetype == "apps") {
    sourcetype="appserver"
    if (url.indexOf("://") < 0)
      url = "https://" +url
  }



  if (typeof(url) === undefined)
  {
    if ( this.controllers.length > 0)
      return this.controllers[0]
    else
      return null
  }


  // If we already have a controller of the requested type and url, return it.
  for (var i = 0; i < this.controllers.length; i++) {
    if (this.controllers[i].datasource.sourcetype === sourcetype && this.controllers[i].datasource.source_address === url) {
      return this.controllers[i]
    }
  }

  // Create a new controller of none found
  const datasource = new this.datasources[sourcetype](url)
  const controller = new Controller(datasource)

  // Save controller for later widget instances
  this.controllers.push(controller)
  return controller
}

Animera.prototype.subscribeTo = function (url,callback) {
  var source = this.parse_data_url(url)

  //Defaulting to appserver
  //if (typeof(source.protocol) === undefined

  var controller = this.getController(source.server,source.protocol)

  //console.log(source,controller);
  controller.bindTopicToCallback(callback,source)

}

Animera.prototype.parse_data_url = function (url) {

  var result = {}

  // Example
  // app://op-en.se/test/signalA.power

  var split1,remainder,split2

  split1 = url.split("://")
  if (split1.length > 1) {
    result.protocol = split1[0]
    result.server = split1[1].split("/")[0]
    remainder = split1[1].substring(result.server.length+1)
  }
  else {
    remainder = url
  }

  split2 = remainder.split(".")
  result.topic = split2[0]
  if (split2.length > 1)
    result.subproperty = split2[1]

  return result
}

Animera.prototype.ready = function () {
  return new Promise((resolve, reject) => {
    document.addEventListener('DOMContentLoaded', function (event) {
      resolve()
    })
  })
}

// ------- START OF THE ANIMERA SCRIPT ---------

// Find top most window and tie ourselves to the global variable 'Animera'
var ANIMERA = 'Animera'
var topmost = window



while (topmost !== topmost.parent) {
  topmost = topmost.parent
}

// Does an instace exist?
if (!topmost.parent.hasOwnProperty(ANIMERA) || topmost.parent[ANIMERA] === 'loading') {
  // Javascript is single threaded, so we don't need a locking mechanism here since this call is synchronous
  // If no instance exists, just create it
  topmost.parent[ANIMERA] = new Animera()
}

// If the data-autobind attribute is set on the script tag, autobind all objects!
if (document.currentScript && document.currentScript.dataset && document.currentScript.dataset.autobind) {
  const bindAdress = document.currentScript.dataset.autobind
  document.addEventListener('DOMContentLoaded', function (event) {
    topmost.parent[ANIMERA].getController(bindAdress).autobind()
  })
}

// animera.js
// This code was created by the open energy playground project 2016.

var Controller = require('./modules/Controller')

var Animera = module.exports = function () {
  this.datasources = {
    appserver: require('./datasources/AppServer')
  }
  this.controllers = []
}

Animera.prototype.getController = function (url, sourcetype) {
  // If no type of source is specified, assume that we are looking for an Op-En App server
  // TODO: replace this with mqtt websockets
  sourcetype = sourcetype || 'appserver'

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

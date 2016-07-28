// animera.js
// This code was created by the open energy playground project 2016.

var AppClient = require('./modules/AppClient')

var Animera = module.exports = function () {
  this.datasources = {'op-en_appserver': AppClient}
  this.controllers = []
}

Animera.prototype.getController = function (url, sourcetype) {
  // If no type of source is specified, assume that we are looking for an Op-En App server
  // TODO: replace this with mqtt websockets
  sourcetype = sourcetype || 'op-en_appserver'

  // If we already have a controller of the requested type and url, return it.
  for (var i = 0; i < this.controllers.length; i++) {
    if (this.controllers[i].sourcetype === sourcetype && this.controllers[i].source_address === url) {
      return this.controllers[i]
    }
  }

  // Create a new controller of none found
  var controller = new this.datasources[sourcetype](url)

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

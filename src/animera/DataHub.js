var AppClient = require('./AppClient')

var DataHub = module.exports = function () {
  this.datasources = {'op-en_appserver': AppClient}
  this.datainstances = []
}

DataHub.prototype.getdatasource = function (sourcetype, url) {
  var nsources = this.datainstances.length

  // Iterate all instances.
  for (var i = 0; i < nsources; i++) {
    if (this.datainstances[i].sourcetype === sourcetype && this.datainstances[i].source_address === url) {
      return this.datainstances[i]
    }
  }

  // Nothing found then create.
  var newDatasource = new this.datasources[sourcetype](url)

  // And add to list.
  if (typeof newDatasource !== 'undefined') {
    this.datainstances.push(newDatasource)
  }

  return newDatasource
}

// /MAIN

// Find top most window.
var topmost = window

while (topmost !== topmost.parent) {
  topmost = topmost.parent
}

// Does an instace exist?
if (!topmost.parent.hasOwnProperty('datahub')) {
  var d = new Date()
  var n = d.getTime()

  if (!topmost.parent.hasOwnProperty('_datahub_loading')) {
    topmost._datahub_loading = n

    if (n === topmost._datahub_loading) {
      // Attatch singeton instance.
      topmost.datahub = new DataHub()

      console.log('Datahub created at timestamp: ' + n)
    }
  }
}

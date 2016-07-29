// Create a namespace
var AnimeraWidget = module.exports = {}

const ANIMERA = 'Animera'
const ANIMERA_QUEUE = 'AnimeraLoadingQueue'
const animeraSourcePath = '<%= animeraPath %>'

AnimeraWidget.parseSettings = require('./modules/parseSettings')

AnimeraWidget.getAnimera = function () {
  // Find top most window.
  var topmost = window
  while (topmost !== topmost.parent) {
    topmost = topmost.parent
  }

  // Check if Animera is already loaded
  if (!topmost.parent.hasOwnProperty(ANIMERA)) {
    // Load Animera in this document
    // It will automatically attach itself to the topmost parent
    topmost.parent[ANIMERA] = 'loading'
    return AnimeraWidget.loadScript(animeraSourcePath).then(() => {
      // If there is a queue, resolve the entire queue waiting for the load of Animera
      if (topmost.parent[ANIMERA_QUEUE]) {
        for (let resolve of topmost.parent[ANIMERA_QUEUE]) {
          resolve()
        }
      }
      return Promise.resolve(topmost.parent[ANIMERA])
    })
  } else if (topmost.parent[ANIMERA] === 'loading') {
    // Loading has started but is not finished, add us to the loading queue

    // Initiate the queue if required
    topmost.parent[ANIMERA_QUEUE] = topmost.parent[ANIMERA_QUEUE] || []

    // Add this resolve to a global queue
    return new Promise((resolve, reject) => {
      topmost.parent[ANIMERA_QUEUE].push(resolve)
    }).then(() => {
      // When returned from the queue
      return Promise.resolve(topmost.parent[ANIMERA])
    })
  } else {
    // Animera object is already loaded
    return Promise.resolve(topmost.parent[ANIMERA])
  }
}

AnimeraWidget.loadScript = function (url) {
  var script = document.createElement('script')

  return new Promise((resolve, reject) => {
    // most browsers
    script.onload = resolve
    // IE 6 & 7
    script.onreadystatechange = function () {
      if (this.readyState === 'complete') {
        resolve()
      }
    }

    if (typeof script !== 'undefined') {
      var destinationDocument = document.getElementsByTagName('head')[0]

      // Check if we are running in an html file or a pure svg
      if (typeof destinationDocument !== 'undefined') {
        script.type = 'text/javascript'
        script.src = url
      } else {
        destinationDocument = document.getElementsByTagName('svg')[0]
        script['xlink:href'] = url
        script['xlink:actuate'] = 'onload'
      }

      // Append the script to the destination document
      // When it loads, the Animera global variable will automatically be populated, and this promise will resolve
      destinationDocument.appendChild(script)
    }
  })
}

AnimeraWidget.init = function (widgetDefaults) {
  // Get the appropriate animera object
  return AnimeraWidget.getAnimera().then((animera) => {
    // Set widget specifics
    // We proceed to parsing the settings in the href of the object tag
    const href = document.defaultView.location.href
    const settings = this.parseSettings(href, widgetDefaults)
    return Promise.resolve({animera: animera, settings: settings})
  })
}

AnimeraWidget.scripts = document.getElementsByTagName('script')
window.AnimeraWidget = AnimeraWidget

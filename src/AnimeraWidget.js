// Create a namespace
var AnimeraWidget = module.exports = {}

const ANIMERA = 'Animera'
const ANIMERA_QUEUE = 'AnimeraLoadingQueue'
const animeraSourcePath = '<%= animeraPath %>'

AnimeraWidget.parseSettings = require('./modules/parseSettings')

AnimeraWidget.getAnimera = function () {
  // Find top most window.
  var topmost = window



  while (typeof(topmost.parent) === "object" && topmost !== topmost.parent) {


    topmost = topmost.parent
  }



  // Check if Animera is already loaded
  if (!topmost.hasOwnProperty(ANIMERA)) {
    // Load Animera in this document
    // It will automatically attach itself to the topmost parent
    topmost[ANIMERA] = 'loading'

    return AnimeraWidget.loadScript(animeraSourcePath).then(() => {
      // If there is a queue, resolve the entire queue waiting for the load of Animera
      if (topmost[ANIMERA_QUEUE]) {
        for (let resolve of topmost[ANIMERA_QUEUE]) {
          resolve()
        }
      }
      return Promise.resolve(topmost[ANIMERA])
    })
  } else if (topmost[ANIMERA] === 'loading') {
    // Loading has started but is not finished, add us to the loading queue

    // Initiate the queue if required
    topmost[ANIMERA_QUEUE] = topmost[ANIMERA_QUEUE] || []

    // Add this resolve to a global queue
    return new Promise((resolve, reject) => {
      topmost[ANIMERA_QUEUE].push(resolve)
    }).then(() => {
      // When returned from the queue
      return Promise.resolve(topmost[ANIMERA])
    })
  } else {
    // Animera object is already loaded
    return Promise.resolve(topmost[ANIMERA])
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

AnimeraWidget.parseifJSON = function (payload){

  try
  {
     var jsonObj = JSON.parse(payload);

     return jsonObj
  }
  catch(e)
  {
    return payload
  }

}

AnimeraWidget.init = function (widgetDefaults) {
  // Get the appropriate animera object
  return AnimeraWidget.getAnimera().then((animera) => {
    // Set widget specifics
    // We proceed to parsing the settings in the href of the object tag
    const href = document.defaultView.location.href
    const settings = this.parseSettings(href, widgetDefaults)
    if (typeof(settings.source) !== 'undefined') {
      console.log("Overriding topic with source parameters");

      var parsedsource = animera.parse_data_url(settings.source)
      //console.log(source);
      if (typeof(parsedsource.server) !== 'undefined'){
        if (parsedsource.protocol == "apps")
          settings.server = "https://" + parsedsource.server
        else if (parsedsource.protocol == "app")
          settings.server = "http://" + parsedsource.server
        else
          settings.server = parsedsource.server
      }
      settings.topic = parsedsource.topic
      settings.protocol = parsedsource.protocol
      settings.subproperty = parsedsource.subproperty
      console.log(settings)
    }

    if (typeof(settings.protocol) === 'undefined') {
      if (settings.server.indexOf("https://") > 0)
        settings.protocol = "apps"
      else {
        settings.protocol = "app"
      }
    }


    return Promise.resolve({animera: animera, settings: settings})
  })
}


AnimeraWidget.scripts = document.getElementsByTagName('script')
window.AnimeraWidget = AnimeraWidget

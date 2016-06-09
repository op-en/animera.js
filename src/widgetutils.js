// Create a namespace
var widgetutils = module.exports = {}

widgetutils.parseparams = function (paramArray) {
  paramArray = paramArray || {'server': 'http://op-en.se:5000', 'topic': 'test/topic1', 'subproperty': null, 'max': 10000}

  var href = document.defaultView.location.href

  // Get the url of myself and parse it for parameters.
  if (href.indexOf('?') !== -1) {
    var paramList = href.split('?')[1].split(/&|;/)
    for (var p = 0, pLen = paramList.length; pLen > p; p++) {
      var eachParam = paramList[ p ]
      var valList = eachParam.split('=')
      var name = unescape(valList[0])
      var value = unescape(valList[1])

      paramArray[ name ] = value.replace('"', '').replace('"', '')
    }
  }

  return paramArray
}

widgetutils.getdatahub = function (name, resourcePath) {
  name = name || 'datahub'
  resourcePath = resourcePath || 'http://op-en.github.io/animera.js/dist/animera.js'
  // resourcePath = resourcePath || '../animera.js'

  // Find top most window.
  var topmost = window
  while (topmost !== topmost.parent) {
    topmost = topmost.parent
  }

  return new Promise((resolve, reject) => {
    // Check if we have a data library.
    if (!topmost.parent.hasOwnProperty(name)) {
      // Dynabically load libraries.
      widgetutils.loadjsfile(resourcePath, function () {
        // console.log('datahub loaded')
        resolve(topmost[name])
      })
      return
    } else {
      resolve(topmost[name])
    }
  })
}

widgetutils.loadjsfile = function (filename, callback) {
  // Default parameter that works in safari as well
  if (typeof (callback) === 'undefined') callback = function () {}

  var script = document.createElement('script')

  // console.log(typeof script)

  // most browsers
  script.onload = callback
  // IE 6 & 7
  script.onreadystatechange = function () {
    if (this.readyState === 'complete') {
      callback()
    }
  }

  if (typeof script !== 'undefined') {
    var dest = document.getElementsByTagName('head')[0]
    // console.log(dest)

    // HTML or pure SVG?
    if (typeof dest !== 'undefined') {
      script.type = 'text/javascript'
      script.src = filename
    } else {
      dest = document.getElementsByTagName('svg')[0]
      script['xlink:href'] = filename
      script['xlink:actuate'] = 'onload'
    }

    // console.log(dest)
    // console.log(script)
    // console.log(dest)
    dest.appendChild(script)
  }
}

widgetutils.init = function () {
  widgetutils.paramArray = widgetutils.parseparams()
  // Returns a promise
  return widgetutils.getdatahub()
}

widgetutils.scripts = document.getElementsByTagName('script')
// widgetutils.path = widgetutils.scripts[widgetutils.scripts.length - 1].src.replace('/widgetutils.js', '')
// console.log(widgetutils.path)

window.widgetutils = widgetutils

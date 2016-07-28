var Rotation = require('./Rotation')
var DeadReckoning = require('./DeadReckoning')

var Controller = module.exports = function (datasource) {
  this.datasource = datasource
  this.animations = []
  this.debug = true

  // Animation loop
  // Note: We are using requestAnimationFrame since it provides much better performance and efficiancy
  // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
  const controller = this
  this.lastTime = new Date().getTime()
  function animationLoop (thisTime) {
    const timeDifference = thisTime - controller.lastTime
    controller.lastTime = thisTime

    // Call all animation functions.
    for (let animation of controller.animations) {
      animation.update(timeDifference)
    }
    window.requestAnimationFrame(animationLoop)
  }
  window.requestAnimationFrame(animationLoop)
}

// Add a connection to set an text element to incomming MQTT data.
// Topic is the mqtt topic
// element is the id of an html element.
// If mqtt data is Json the optional subproperty can be used to get a specific property of the data.
Controller.prototype.bindTopicToHtml = function (element, settings) {
  var subproperty = settings.subproperty || null
  var unit = settings.unit || ''
  var topic = settings.topic || ''
  var decimals = settings.decimals || null

  if (typeof element === 'string' || element instanceof String) {
    element = document.getElementById(element)
  }

  this.datasource.subscribe(topic, function (topic, payload) {
    var data
    if (subproperty != null) {
      try {
        payload = JSON.parse(payload)
      } catch (e) {
        console.error(e)
        return
      }

      data = payload[subproperty]

      if (this.debug) {
        console.log(data)
        console.log(payload)
      }
    } else {
      data = payload
    }

    // Is the decimals argument set.
    if (typeof (decimals) !== 'undefined') {
      // See if number
      var value = parseFloat(data)

      // If it is adjust the number of decimals.
      if (!isNaN(value)) {
        data = value.toFixed(decimals)
      }
    }
    // Only if string.
    element.innerHTML = '' + data + unit
  })
}

Controller.prototype.bind_topic_to_style = function (element, topic, style, subproperty) {
  if (typeof (subproperty) === 'undefined') subproperty = null

  if (typeof element === 'string' || element instanceof String) {
    element = document.getElementById(element)
  }

  this.datasource.subscribe(topic, function (topic, payload) {
    var data
    if (subproperty != null) {
      payload = JSON.parse(payload)
      data = payload[subproperty]
    } else {
      data = payload
    }

    // Only if string.
    element['style'][style] = '' + data
  })
}

Controller.prototype.bindTopicToRotation = function (element, settings) {
  // console.log('rotate')
  // console.log(settings)
  var relative = settings.relative || true
  var subproperty = settings.subproperty || null
  var inputRange = settings.inputRange || null
  var max = settings.max || null
  var outputRange = settings.outputRange || null
  var clamp = settings.clamp || null
  var topic = settings.topic || ''

  // Creation animantion object.
  var rotation = new Rotation(element, relative, subproperty)

  if (inputRange === null && max !== null) {
    inputRange = [0, max]
  }

  if (inputRange != null && outputRange != null) {
    rotation.input_m = (outputRange[1] - outputRange[0]) / (inputRange[1] - inputRange[0])
    rotation.input_c = outputRange[0] - (rotation.input_m * inputRange[0])
  }

  if (clamp === true && inputRange != null) {
    inputRange.sort()
    rotation.input_max = inputRange[1]
    rotation.input_min = inputRange[0]
  }

  this.animations.push(rotation)

  // Add update function.
  this.datasource.subscribe(topic, function (topic, payload) { rotation.mqtt(topic, payload) })

  return rotation
}

Controller.prototype.dead_reckoning = function (callback, topic, timeProperty, valueProperty, rateProperty, updateFq, updateDelta, timeout, goback) {
  var deadreckoning = new DeadReckoning(callback, timeProperty, valueProperty, rateProperty, updateFq, updateDelta, timeout, goback)

  return deadreckoning
}

Controller.prototype.bind_topic_to_callback_with_dead_reckoning = function (callback, topic, timeProperty, valueProperty, rateProperty, updateFq, updateDelta, timeout, goback) {
  var deadreckoning = new DeadReckoning(callback, timeProperty, valueProperty, rateProperty, updateFq, updateDelta, timeout, goback)

  // Add update function.
  this.datasource.subscribe(topic, function (topic, payload) { deadreckoning.mqtt(topic, payload) })

  return deadreckoning
}

Controller.prototype.bind_topic_to_html_with_dead_reckoning = function (element, topic, timeProperty, valueProperty, rateProperty, updateFq, updateDelta, timeout, goback, decimals) {
  if (typeof decimals === 'undefined') {
    decimals = 0
  }

  // Creation animantion object.
  var callback = function (topic, payload) {
    var data = payload[valueProperty].toFixed(decimals)

    // Only if string.
    element.innerHTML = '' + data
  }

  var deadreckoning = new DeadReckoning(callback, timeProperty, valueProperty, rateProperty, updateFq, updateDelta, timeout, goback)

  // Add update function.
  this.datasource.subscribe(topic, function (topic, payload) { deadreckoning.mqtt(topic, payload) })

  return deadreckoning
}

Controller.prototype.autobind = function (bindDocument, className) {
  const controller = this
  bindDocument = bindDocument || document
  className = className || 'animera'

  // Find all object tags in current document
  const objects = bindDocument.getElementsByTagName('object')

  // Iterate over the object tags recursively and autobind them when they are ready
  // This results in the whole tree being autobinded (autobound?)
  for (let subObject of objects) {
    subObject.addEventListener('load', function () {
      controller.autobind(subObject.contentDocument)
    })
  }

  // Find all elements that have the requested autobind class
  const bindObjects = bindDocument.getElementsByClassName(className)

  // Iterate over all the objects to bind
  for (let bindObject of bindObjects) {
    // Extract the requested method and it's settings
    let method
    let settings
    if (bindObject.dataset) {
      method = bindObject.dataset.method
      settings = bindObject.dataset.settings
    } else {
      // If html5 data-* attributes are not supported, such as in SVG1.1, we need to use getAttribute instead
      method = bindObject.getAttribute('data-method')
      settings = bindObject.getAttribute('data-settings')
    }

    if (method == null) {
      console.warn('Failed to autobind: animera class present but no data-method attribute set')
      continue
    }

    // If there is a method with the name supplied, go ahead
    if (typeof controller[method] === 'function') {
      try {
        settings = JSON.parse(settings)
      } catch (e) {
        console.error(e)
        console.warn('Failed to autobind: animera class present but data-settings was not valid JSON')
        continue
      }

      // Bind the method!
      controller[method](bindObject, settings)
    } else {
      console.warn('Failed to autobind: animera class present but data-method did not match an existing animera method')
    }
  }
}

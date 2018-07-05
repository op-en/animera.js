var Rotation = require('./Rotation')
var AnimationController = require('./AnimationController')
var DeadReckoning = require('./DeadReckoning')
var Timeseries = require('../Timeseries/TimeSeries')
var Time = require('../Timeseries/Time')

const parseSettings = require('./parseSettings')


var Controller = module.exports = function (datasource) {
  this.datasource = datasource
  this.animations = []
  this.debug = true
  this.time = new Time()

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
Controller.prototype.bindTopicToCallback = function (callback, settings) {
  this.parse_settings(settings)

  var subproperty = settings.subproperty || null
  var topic = settings.topic || ''
  var decimals = settings.decimals || null


  this.datasource.subscribe(topic, function (topic, payload) {
    var data

    try {
      payload = JSON.parse(payload)
        } catch (e) {
      console.error(e)
      data = payload
      return
    }

    if (subproperty != null) {
      data = payload[subproperty]
    } else {
      data = payload
    }

    //

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
    callback(data,payload)
  })
}



// Add a connection to set an text element to incomming MQTT data.
// Topic is the mqtt topic
// element is the id of an html element.
// If mqtt data is Json the optional subproperty can be used to get a specific property of the data.
Controller.prototype.bindTopicToHtml = function (element, settings) {

  this.parse_settings(settings)

  var subproperty = settings.subproperty || null
  var unit = settings.unit || ''
  var topic = settings.topic || ''
  var decimals = settings.decimals || null
  var sign = settings.sign || null

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

    //if (data < 0)
    //  console.log("data", data, typeof (sign),typeof(data) ,data)
    // Is the sign argument set.
    if (typeof (sign) !== 'undefined') {
      var value = parseFloat(data)

      if (sign == "ignore") {
        data = Math.abs(value)
      }
      else if (sign == "invert") {
        data = value * -1
      }
    }

    //Set
    element.innerHTML = '' + data + unit
  })
}

Controller.prototype.bind_topic_to_style = function (element, style, settings) {

  this.parse_settings(settings)

  if (typeof element === 'string' || element instanceof String) {
    element = document.getElementById(element)
  }

  if (typeof (settings.subproperty) === 'undefined') subproperty = null
  if (typeof (settings.max) === 'undefined') max = 10000
  if (typeof (settings.outputRange) === 'undefined') outputRange = [0,1]


  var m=(settings.outputRange[1] - settings.outputRange[0]) /  settings.max
  var c= settings.outputRange[1]-m*settings.max

  console.log(":::::",m,c)

  this.datasource.subscribe(settings.topic, function (topic, payload) {
    var data
    if (settings.subproperty != null) {
      payload = JSON.parse(payload)
      data = payload[settings.subproperty]
    } else {
      data = payload
    }



    var value = m*data + c

    // Only if string.
    element['style'][style] = '' + value
  })
}

Controller.prototype.animateStyle = function (element,style,formula, settings) {

  this.parse_settings(settings)
  console.log(settings)

  var subproperty = settings.subproperty || null
  var topic = settings.topic || ''
  if (formula == null)
    formula = "%value%"

  if (typeof element === 'string' || element instanceof String) {
    element = document.getElementById(element)
  }

  var SpeedControl = new AnimationController(element, style, formula)



  this.bindTopicToCallback(function(value){

    var max=1
    var min=0
    var m,c,animationSpeed

  //document.getElementById("svgloop").setCurrentTime(0)
    m=(settings.outputRange[1] - settings.outputRange[0]) /  settings.max
    c= settings.outputRange[1]-m*settings.max
    animationSpeed = m*value + c

    if(settings.clamp== true) {
      if(settings.outputRange[0] > settings.outputRange[1]) {
         max = 0
         min = 1
      }
      if (animationSpeed>settings.outputRange[max]) {
          animationSpeed=settings.outputRange[max]
      }
      if (animationSpeed<settings.outputRange[min]) {
          animationSpeed=settings.outputRange[min]
      }

    }

    if(value==0) {
      animationSpeed = 0;
    }

    SpeedControl.SetSpeed(animationSpeed)

  },settings)

  return SpeedControl;

}

Controller.prototype.bindTopicToHeight = function (element, settings) {

  parse_settings(settings)

  var subproperty = settings.subproperty || null
  var topic = settings.topic || ''
  var max = settings.max || 1
  var min = settings.min || 0

  if (typeof element === 'string' || element instanceof String) {
    element = document.getElementById(element)
  }

  this.datasource.subscribe(settings.topic, function (topic, payload) {
    var data
    if (subproperty != null) {
      payload = JSON.parse(payload)
      data = payload[subproperty]
    } else {
      data = payload
    }

    if (data > settings.max) {
      data = settings.max
    }

    if (data < settings.min) {
      data = settings.min
    }



    var scale = (data - settings.min) / (settings.max - settings.min)

    //console.log([scale,data,settings.min,settings.max])

    // Only if string.
    element['style']['transform'] = 'scaleY(' + scale + ')'
  })
}

Controller.prototype.bindTopicToWidth = function (element, settings) {

  this.parse_settings(settings)

  var subproperty = settings.subproperty || null
  var topic = settings.topic || ''
  var max = settings.max || 1
  var min = settings.min || 0

  if (typeof element === 'string' || element instanceof String) {
    element = document.getElementById(element)
  }

  this.datasource.subscribe(settings.topic, function (topic, payload) {
    var data
    if (subproperty != null) {
      payload = JSON.parse(payload)
      data = payload[subproperty]
    } else {
      data = payload
    }

    if (data > settings.max) {
      data = settings.max
    }

    if (data < settings.min) {
      data = settings.min
    }



    var scale = (data - settings.min) / (settings.max - settings.min)

    //console.log([scale,data,settings.min,settings.max])

    // Only if string.
    element['style']['transform'] = 'scaleX(' + scale + ')'
  })
}

Controller.prototype.bindTopicToRotation = function (element, settings) {

  this.parse_settings(settings)

  if (typeof element === 'string' || element instanceof String) {
    element = document.getElementById(element)
  }

  var relative = settings.relative
  if (relative === undefined) {
    relative = true
  }
  var subproperty = settings.subproperty || null
  var inputRange = settings.inputRange || null
  var max = settings.max || null
  var outputRange = settings.outputRange || null
  var clamp = settings.clamp || null
  var topic = settings.topic || ''
  var transform_origin = settings["transform-origin"] || "50% 50%"

  element.style["transform-origin"]=transform_origin

  if (this.debug) {
    console.log(settings)
  }

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

Controller.prototype.bindTopicToHtmlWithDeadReckoning = function (element, settings) {
  // Creation animantion object.
  var callback = function (topic, payload) {
    var data = payload[settings.valueProperty].toFixed(settings.decimals)

    // Only if string.
    element.innerHTML = '' + data
  }

  var deadreckoning = new DeadReckoning(callback, settings)

  // Add update function.
  this.datasource.subscribe(settings.topic, function (topic, payload) { deadreckoning.mqtt(topic, payload) })

  return deadreckoning
}

Controller.prototype.getDataSeriesBuffer = function (element, settings) {

  return new Timeseries.DataSeriesBuffer(this.time)
}

Controller.prototype.parse_settings = function(settings) {

  console.log(typeof(settings.source))
  if (typeof(settings.source) !== 'undefined') {
    //console.log("Overriding topic with source parameters");

    var parsedsource = this.Animera.parse_data_url(settings.source)

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

  return settings
}

Controller.prototype.autobind = function (bindDocument, objectData) {
  const controller = this
  bindDocument = bindDocument || document

  // Find all object tags in current document
  const objects = bindDocument.getElementsByTagName('object')

  // Iterate over the object tags recursively and autobind them when they are ready
  // This results in the whole tree being autobinded (autobound?)
  for (let subObject of objects) {
    subObject.addEventListener('load', function () {
      // We also parse the settings of the data string, so that they are transferred to the autobind object
      controller.autobind(subObject.contentDocument, subObject.data)
    })
  }

  // Find all elements that have the requested autobind class
  const bindObjects = bindDocument.querySelectorAll('[animera]')

  // Iterate over all the objects to bind
  for (let bindObject of bindObjects) {
    // Extract the requested method and it's settings
    const animera = bindObject.getAttribute('animera')
    const method = animera.split('?')[0]
    // The settings are parsed two times if we have objectData
    // once to extract the default values in the svg/widget
    // and once to override them with the values specified in the object tag
    const settings = objectData ? parseSettings(objectData, parseSettings(animera)) : parseSettings(animera)

    if (method == null) {
      console.warn('Failed to autobind: animera class present but no data-method attribute set')
      continue
    }

    // If there is a method with the name supplied, go ahead
    if (typeof controller[method] === 'function') {
      // Bind the method!
      controller[method](bindObject, settings)
    } else {
      console.warn('Failed to autobind: animera class present but data-method did not match an existing animera method')
    }
  }
}

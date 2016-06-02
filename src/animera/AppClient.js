var io = require('socket.io-client')

var Rotation = require('./Rotation')

var AppClient = module.exports = function (url) {
  this.io = io.connect(url)
  this.io.appclient = this
  this.connected = false
  this.subscribers = {}
  this.retention = {}
  this.rotations = []
  this.autobindings = null
  this.autoid = 0
  this.sourcetype = 'op-en_appserver'
  this.source_address = url
  this.debug = true
  this.lock = 0

  var d = new Date()

  this.lastupdate = d.getTime()

  this.timer = setInterval(function (appclient) {
    // Get time.
    var d = new Date()
    var n = d.getTime()
    var delta = n - appclient.lastupdate

    appclient.lastupdate = n

    // Call all animation functions.
    var arrayLength = appclient.rotations.length

    for (var i = 0; i < arrayLength; i++) {
      appclient.rotations[i].update(delta)
    }
  }, 30, this)

  // if (this.debug) {
  //   console.log('AppServer instantiated')
  // }

  // Handle incomming MQTT messages
  this.io.on('mqtt', function (msg) {
    if (this.appclient.debug) {
      console.log('RECIVED: ' + msg.topic + ' : ' + msg.payload)
    }
    //

    // Any subscribers?
    for (var topic in this.appclient.subscribers) {
      // Match topics hand # sign
      var handlers
      var i

      // If topic end with # and msg.topic contains topic -1 char then call handlers
      if (topic.slice(-1) === '#') {
        if (msg.topic.indexOf(topic.slice(0, -1)) === 0) {
          handlers = this.appclient.subscribers[topic]

          var arrayLength = handlers.lenght

          for (i = 0; i < arrayLength; i++) {
            handlers[i](msg.topic, msg.payload)
          }
        }
      } else if (topic === msg.topic) {
        // If topic does not contain # and is exact match with msg.topic call all handlers.
        // console.log(topic)

        handlers = this.appclient.subscribers[topic]

        for (i = 0; i < handlers.length; i++) {
          handlers[i](msg.topic, msg.payload)
        }
      }
    }

    // Update retention
    this.appclient.retention[msg.topic] = msg.payload
  })

  // Handle connection.
  this.io.on('connect', function () {
    if (this.appclient.debug) {
      console.log(this.appclient.sourcetype + ' connection established to ' + this.appclient.source_address)
    }
    this.appclient.connected = true

    for (var topic in this.appclient.subscribers) {
      console.log('Subscribing to ' + topic)
      this.emit('subscribe', {'topic': topic})
    }

    // Subscribe
  })

// return this
}

// Add a function that handles incomming MQTT data
AppClient.prototype.subscribe = function (topic, handler) {
  var d = new Date()
  var n = d.getTime()

  this.lock++

  if (this.lock > 1) {
    console.log('Bang!!')
  }

  // console.log(n)

  // Check if topic exists
  if (!(topic in this.subscribers)) {
    // console.log("new topic")

    // If not add topic and handler to subscribers list.
    this.subscribers[topic] = [handler]

    // Subscribe to data.
    if (this.connected) {
      console.log('Subscribing to ' + topic)
      this.io.emit('subscribe', {'topic': topic})
    }
  } else {
    // Otherwise just add handler to subscriber list
    this.subscribers[topic].push(handler)

    // And send old data if any.
    if (topic in this.retention) {
      handler(topic, this.retention[topic])
    }
  }

  // console.log(this.lock)
  // console.log(n)

  this.lock--
}

AppClient.prototype.subscribe_to_subproperty = function (topic, subproperty, handler) {
  if (typeof (subproperty) === 'undefined') subproperty = null

  this.subscribe(topic, function (topic, payload) {
    var data
    if (subproperty != null) {
      payload = JSON.parse(payload)

      // console.log(payload)

      data = payload[subproperty]

      // console.log(data)
    } else {
      data = payload
    }

    // Only if string.
    handler(topic, data)
  })
}

// Add a connection to set an text element to incomming MQTT data.
// Topic is the mqtt topic
// element is the id of an html element.
// If mqtt data is Json the optional subproperty can be used to get a specific property of the data.
AppClient.prototype.bind_topic_to_html = function (element, topic, subproperty, unit) {
  if (typeof (subproperty) === 'undefined') subproperty = null
  if (typeof (unit) === 'undefined') unit = ''
  if (typeof element === 'string' || element instanceof String) {
    element = document.getElementById(element)
  }

  this.subscribe(topic, function (topic, payload) {
    var data
    if (subproperty != null) {
      payload = JSON.parse(payload)

      console.log(payload)

      data = payload[subproperty]

      console.log(data)
    } else {
      data = payload
    }

    // Only if string.
    element.innerHTML = '' + data + unit
  })
}

AppClient.prototype.bind_topic_to_style = function (element, topic, style, subproperty) {
  if (typeof (subproperty) === 'undefined') subproperty = null

  if (typeof element === 'string' || element instanceof String) {
    element = document.getElementById(element)
  }

  this.subscribe(topic, function (topic, payload) {
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

// New version
AppClient.prototype.bind_topic_to_rotation = function (element, topic, relative, subproperty, input_range, output_range, clamp) {
  if (typeof (relative) === 'undefined') relative = true
  if (typeof (subproperty) === 'undefined') subproperty = null

  if (typeof (input_range) === 'undefined') input_range = null
  if (typeof (output_range) === 'undefined') output_range = null
  if (typeof (clamp) === 'undefined') clamp = false

  // Creation animantion object.
  var rotation = new Rotation(element, relative, subproperty)

  if (input_range != null && output_range != null) {
    rotation.input_m = (output_range[1] - output_range[0]) / (input_range[1] - input_range[0])
    rotation.input_c = output_range[0] - (rotation.input_m * input_range[0])
  }

  if (clamp === true && input_range != null) {
    input_range.sort()
    rotation.input_max = input_range[1]
    rotation.input_min = input_range[0]
  }

  this.rotations.push(rotation)

  // Add update function.
  this.subscribe(topic, function (topic, payload) { rotation.mqtt(topic, payload) })

  return rotation
}

AppClient.prototype.autobind = function (mydoc, class_name) {
  if (typeof (mydoc) === 'undefined') mydoc = document

  if (typeof (class_name) === 'undefined') class_name = null

  // Use a specific class name or just look for mqtt atrribute.
  var list
  if (class_name == null) {
    list = mydoc.querySelectorAll('[mqtt]')
  } else {
    list = mydoc.getElementsByClassName(class_name)
  }

  // Iterate all elements found.
  var arrayLength = list.length

  for (var i = 0; i < arrayLength; i++) {
    // Already set?
    if (list[i].hasOwnProperty('mqtt')) {
      continue
    }

    // Get parameter
    var parameters = list[i].getAttribute('mqtt')

    // Return if not present.
    if (parameters == null) {
      continue
    }

    // Only allow bind functions to be called.
    if (parameters.indexOf('bind') !== 0) {
      continue
    }

    if (list[i].id === '') {
      // console.log("No id")
      list[i].id = '_mqtt_' + this.autoid
      // console.log(list[i].id);
      this.autoid = this.autoid + 1
    }

    // Insert id automatically
    if (parameters.indexOf('"' + list[i].id + '"') === -1) {
      parameters = parameters.replace('(', '("' + list[i].id + '", ')
    }

    if (this.debug) {
      console.log('Adding binding: ' + parameters)
    }

    list[i].mqtt = eval('this.' + parameters)
  }
  // if (this.autobindings == null) {
  // }
}

AppClient.prototype.autobind_after_page_load = function (mydoc, class_name) {
  mydoc.addEventListener('DOMContentLoaded', function () {
    //
    this.autobind(class_name)
  }, false)
}

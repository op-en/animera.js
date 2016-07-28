var io = require('socket.io-client')

var AppClient = module.exports = function (url) {
  this.io = io.connect(url)
  this.io.appclient = this
  this.connected = false
  this.subscribers = {}
  this.retention = {}
  this.sourcetype = 'appserver'
  this.source_address = url

  // var d = new Date()
  //
  // this.lastupdate = d.getTime()

  // this.timer = setInterval(function (appclient) {
  //   // Get time.
  //   var d = new Date()
  //   var n = d.getTime()
  //   var delta = n - appclient.lastupdate
  //
  //   appclient.lastupdate = n
  //
  //   // Call all animation functions.
  //   var arrayLength = appclient.rotations.length
  //
  //   for (var i = 0; i < arrayLength; i++) {
  //     appclient.rotations[i].update(delta)
  //   }
  // }, 30, this)

  // if (this.debug) {
  //   console.log('AppServer instantiated')
  // }

  // Handle incomming MQTT messages
  this.io.on('mqtt', this.recieve)

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

AppClient.prototype.recieve = function (msg) {
  if (this.appclient.debug) {
    console.log('RECIVED: ' + msg.topic + ' : ' + msg.payload)
  }

  // Any subscribers?
  for (var topic in this.appclient.subscribers) {
    // Match topics hand # sign
    var handlers
    var i

    // If topic end with # and msg.topic contains topic -1 char then call handlers
    if (topic.slice(-1) === '#') {
      if (msg.topic.indexOf(topic.slice(0, -1)) === 0) {
        handlers = this.appclient.subscribers[topic]

        var arrayLength = handlers.length

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
}

// Publish an mqtt message.
AppClient.prototype.publish = function (topic, payload, locally) {
  if (typeof (locally) === 'undefined') {
    locally = false
  }

  if (typeof payload === 'object') {
    payload = JSON.stringify(payload)
  }

  var msg = { 'topic': topic, 'payload': payload }

  // Publish to broker
  if (locally === false) {
    this.io.emit('publish', msg)
  } else {
    this.recieve(msg)
  }
}

// Add a function that handles incomming MQTT data
AppClient.prototype.subscribe = function (topic, handler) {
  // var d = new Date()
  // var n = d.getTime()

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

AppClient.prototype.subscribeToSubproperty = function (topic, subproperty, handler) {
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

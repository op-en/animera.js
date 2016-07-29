// WIKIPEDIA:   In navigation, dead reckoning or dead-reckoning (also ded for deduced reckoning or DR)
// is the process of calculating one's current position by using a previously determined position, or fix,
// and advancing that position based upon known or estimated speeds over elapsed time and course.
// The corresponding term in biology, used to describe the processes by which animals update their estimates
// of position or heading, is path integration.

// SCOPE: This code aima so keep a realtime variable our counter at the correct value even if update frequency of the value
// is lower than the rate at wich the value changes.

// A typical example is power consumption where we want to have a meter counter which counts the current energy consumption
// Given the absolute value of the counter at a given time and the rate of change i.e. the power this class will progress the
// meter value in accorance with the rate/power.

var DeadReckoning = module.exports = function (callback, settings) {
  this.callback = callback
  this.valueProperty = settings.valueProperty || 'value'
  this.rateProperty = settings.rateProperty || 'rate'
  this.timeProperty = settings.timeProperty || 'time'
  this.updateFq = settings.updateFq || null
  this.updateDelta = settings.updateDelta || (this.updateFq === null ? 1.0 : null)
  this.timeout = settings.timeout || 60
  this.goback = settings.goback || false
  this.timestamp = 0
  this.warn = null
  this.warn_callback = function () { console.log('Warning triggerd!') }

  this.value = 0
  this.rate = 0
  this.timestamp = 0
  this.current = 0
  this.interpolation_time = 0
  this.timer = null

  return this
}

DeadReckoning.prototype.reckon = function () {
  var now = new Date().getTime() / 1000.0

  var delta = now - this.timestamp
  var wait = 9999999

  // Clear timers
  if (this.timer != null) {
    clearTimeout(this.timer)
    this.timer = null
  }

  console.log('Delta: ' + delta)

  // If the data is to old do nothing.
  if (delta > this.timeout) {
    return
  }

  if (this.warn != null && (now > this.warn)) {
    this.warn_callback()
  }

  // Calculate current value
  var current = this.value + (this.rate * delta)
  // var interpolationTime = now

  // Wait if prevous calculations overshoot the current and the goback setting is false.
  if (this.goback === false && current < this.current) {
    // Wait unil the value catches up with the derived value.
    wait = (this.current - current) / this.rate
    this.timer = setTimeout(function (dr) { dr.reckon() }, wait * 1000, this)
    return
  }

  this.current = current
  this.interpolationTime = now

  var dic = {}
  dic[this.timeProperty] = this.interpolationTime
  dic[this.valueProperty] = current
  dic[this.rateProperty] = this.rate

  this.callback(this.topic, dic)

  // Calculate next update.
  if (this.updateFq != null) {
    wait = this.updateFq
  } else if (this.updateDelta != null) {
    var ttnext = this.updateDelta / this.rate

    if (ttnext < wait) {
      wait = ttnext
    }
  } else {
    return
  }

  if (wait < (1 / 30)) {
    wait = 1 / 30
  }

  console.log('Wait: ' + wait)

  this.timer = setTimeout(function (dr) { dr.reckon() }, wait * 1000, this)
}

DeadReckoning.prototype.mqtt = function (topic, payload) {
  // var newdata

  // Avoid looping messages
  if (topic === this.resultTopic) {
    return
  }

  this.topic = topic

  // Parse data
  if (typeof payload !== 'object') {
    payload = JSON.parse(payload)
  }

  var rate = parseFloat(payload[this.rateProperty])
  var value = parseFloat(payload[this.valueProperty])
  var timestamp = parseFloat(payload[this.timeProperty])

  // All parameters read save for later.
  this.value = value
  this.rate = rate
  this.timestamp = timestamp

  // Calculate current and next value to send
  this.reckon()
}

DeadReckoning.prototype.update = function (timestamp, rate, value) {
  // All parameters read save for later.
  this.value = value
  this.rate = rate
  this.timestamp = timestamp

  // Calculate current and next value to send
  this.reckon()
}

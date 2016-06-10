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

var DeadReckoning = module.exports = function (callback, timeProperty, valueProperty, rateProperty, updateFq, updateDelta, timeout, goback) {
  this.callback = callback
  this.valueProperty = valueProperty
  this.rateProperty = rateProperty
  this.timeProperty = timeProperty
  this.updateFq = updateFq
  this.updateDelta = updateDelta
  this.timeout = timeout
  this.goback = goback
  this.timestamp = 0



  if (typeof this.goback === 'undefined') {
    this.goback = false
  }

  if (typeof this.timeout === 'undefined') {
    this.timeout = 60
  }

  if (typeof this.valueProperty === 'undefined') {
    this.valueProperty = 'value'
  }

  if (typeof this.rateProperty === 'undefined') {
    this.rateProperty = 'rate'
  }

  if (typeof this.timeProperty === 'undefined') {
    this.timeProperty = 'time'
  }

  if (typeof this.updateFq === 'undefined') {
    this.updateFq = null
  }

  if (typeof this.updateDelta === 'undefined') {
    if (this.updateFq == null) {
      this.updateDelta = 1.0
    } else {
      this.updateDelta = null
    }
  }

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

  // If the data is to old do nothing.
  if (delta > this.timeout) {
    return
  }

  // Calculate current value
  var current = this.value + (this.rate * delta)
  var interpolationTime = now


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

  if (wait < (1/30))
    wait = 1/30

  this.timer = setTimeout(function (dr) { dr.reckon() }, wait * 1000, this)
}

DeadReckoning.prototype.mqtt = function (topic, payload) {
  var newdata

  // Avoid looping messages
  if (topic === this.resultTopic) {
    return
  }

  this.topic = topic

  // Parse data
  payload = JSON.parse(payload)
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

var Rotation = module.exports = function (id, relative, subproperty) {
  if (typeof (relative) === 'undefined') relative = true
  if (typeof (subproperty) === 'undefined') subproperty = null

  if (typeof id === 'string' || id instanceof String) {
    this.id = id
    this.element = document.getElementById(id)
  } else {
    this.element = id
    this.id = this.element.id
  }

  this.subproperty = subproperty
  this.relative = relative

  this.target_value = 0
  this.position = 0
  this.speed = 0
  this.force = 0.01
  this.mass = 100
  this.max_speed = 0.0
  this.stop_speed = 0.004

  this.input_m = 1
  this.input_c = 0
  this.input_max = null
  this.input_min = null

  this.finnished = true

  return this
}

// Called x times per second to preform the animation.
Rotation.prototype.update = function (deltaTime) {
  var change

  if (this.relative === false) {
    return
  // change = this.update_direction(deltaTime)
  } else {
    change = this.update_rotation(deltaTime)
  }

  this.position = this.position + change

  this.setvalue()
}

Rotation.prototype.update_rotation = function (deltaTime) {
  var f, speedChange, change, diff

  f = this.force
  diff = this.max_speed - this.speed

  // Run only if we are in progress of changing speed.
  if (diff !== 0) {
    if (diff < 0) {
      f = f * -1
    }

    speedChange = (f / this.mass) * deltaTime

    if ((speedChange > diff && diff >= 0) || (speedChange < diff && diff < 0)) {
      speedChange = diff
    }

    this.speed = this.speed + speedChange
  }

  change = this.speed * deltaTime

  // console.log(diff + " " + change)

  return change
}

Rotation.prototype.update_direction = function (deltaTime) {}

// New incomming data.
Rotation.prototype.mqtt = function (topic, payload) {
  var newdata
  if (this.subproperty == null) {
    newdata = parseFloat(payload)
  } else {
    payload = JSON.parse(payload)
    newdata = payload[this.subproperty]
  }

  // Clamp data:
  if (this.input_max != null) {
    if (newdata > this.input_max) {
      newdata = this.input_max
    }
  }

  if (this.input_min != null) {
    if (newdata < this.input_min) {
      newdata = this.input_min
    }
  }

  // Translate data.
  newdata = this.input_m * newdata + this.input_c

  if (this.relative === true) {
    // console.log(payload)
    // console.log(newdata)

    if (newdata !== this.max_speed) {
      this.max_speed = newdata
      this.finnished = false
    }
  } else {
    if (newdata !== this.target_value) {
      this.target_value = newdata
      this.finnished = false

      this.position = this.target_value
      this.setvalue()
    }
  }
}

Rotation.prototype.setvalue = function () {
  this.position = this.position % 360

  this.element.style.webkitTransform = 'rotate(' + this.position + 'deg)'
  this.element.style.mozTransform = 'rotate(' + this.position + 'deg)'
  this.element.style.msTransform = 'rotate(' + this.position + 'deg)'
  this.element.style.oTransform = 'rotate(' + this.position + 'deg)'
  this.element.style.transform = 'rotate(' + this.position + 'deg)'
}

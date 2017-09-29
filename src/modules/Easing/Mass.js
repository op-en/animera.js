

var Mass = module.exports = function () {
  this.current_speed = 0
  this.force = 1
  this.mass = 100
  this.target_speed = 0.0
  this.stop_speed = 0.004
  this.finnished = true
  this.lastupdate = 0
  return this
}

Mass.prototype.UpdateSpeed = function (now) {
  var f, speedChange, change, diff,deltaTime


  if (this.lastupdate == 0)
    this.lastupdate = now;

  deltaTime = now - this.lastupdate;
  this.lastupdate = now;

  f = this.force
  diff = this.target_speed - this.current_speed

  // Run only if we are in progress of changing speed.
  if (diff !== 0) {
    if (diff < 0) {
      f = f * -1
    }

    speedChange = (f / this.mass) * deltaTime

    if ((speedChange > diff && diff >= 0) || (speedChange < diff && diff < 0)) {
      speedChange = diff
    }

    this.current_speed = this.current_speed + speedChange
  }

  console.log(this.current_speed);
  return this.current_speed
}

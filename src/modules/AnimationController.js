var Mass = require('./Easing/Mass')

var AnimationController = module.exports = function (target, property, formula) {
  this.self = this
  this.time = Date.now();
  this.value = 0.0
  this.speed = 0.0
  this.update_period = 300
  this.timer = setTimeout(this.animator,this.update_period,this)
  this.accelerationtimer = null
  this.target = target
  this.property = property

//  window.onfocus = function() {
//    this.Reset()
//    console.log("Resetting animation!");
//  }

  if (formula == undefined){

    formula = "%value%"
  }

  this.formula = formula
  this.transition_duration = 10
  this.transition = false

  this.SetTransition(true);

  this.AnimationPeriod = 60

  this.ManualUpate = null

  this.GetSpeed = this.LinearEase

  this.acceleration = 30
  this.dynamicforce = 1
  this.oldspeed = 0.0
  this.SpeedUpdate = 0
  this.lastspeed = 0
  this._lastease = 0

}



AnimationController.prototype.animator = function(self,manual) {

  //var transition_duration = this.target.style["transition-duration"]
  self.Update(self)
  //console.log(ping);
  //if (!self.idle)
    self.timer = setTimeout(self.animator,self.update_period,self)
  //else
  //  self.timer = setTimeout(self.animator,1000*self.transition_duration/2,self)
}

AnimationController.prototype.NoEase = function() {
  this.lastspeed = this.speed
  return this.speed
}

AnimationController.prototype.LinearEase = function() {

  //Maintain and calculate a delta time between calls
  var now = Date.now()



  if (this.lastspeed == this.speed) {
      this._lastease = now
    //  if (this.accelerationtimer != null) {
    //    clearInterval(this.accelerationtimer)
    //    this.accelerationtimer = null
    //  }
    //  if (!this.idle)
    //    console.log("No acceleration!");

      this.idle = true
      return this.speed
  }

//  if (this.idle)
//    console.log("Accelerating!");
  this.idle = false


  var diff = this.speed - this.lastspeed

  if (this._lastease == 0)
    this._lastease = now
  var delta = now - this._lastease
  this._lastease = now

  //Calculate speed change based on time and acceleration.
  var speedChange = (delta * this.acceleration / 1000)

  if (this.lastspeed > this.speed)
      speedChange = speedChange * -1

  speedChange = speedChange + (diff * this.dynamicforce * delta/1000)

  var newspeed = this.lastspeed + speedChange

  //Check if we passed the target speed and stop if we did.
  if ((newspeed >= this.speed && this.speed > this.lastspeed) ||
   (newspeed <= this.speed && this.speed < this.lastspeed)) {
     newspeed = this.speed
   }
   //console.log(newspeed,speedChange,this.lastspeed,(delta * this.acceleration / 1000),this.speed,diff * this.dynamicforce,delta);
  //console.log(newspeed-this.lastspeed,": ",newspeed,this.speed,this.lastspeed,speedChange,delta);
  this.lastspeed = newspeed
  return newspeed
}


AnimationController.prototype.UpdateValue = function() {
  var now = Date.now()

  var reset = false
  //Calculate the current position
  var deltatime = (now - this.time)/1000;


  var value = this.value + ((deltatime) * this.lastspeed)

  if (deltatime > this.transition_duration){
    console.log("Stalled timmer detected!");
    deltatime = this.transition_duration
    value = value % this.AnimationPeriod
    reset = true
  }

  //MAX value in firefox is 33554400
  if (value > 33554400) {
    value = value % this.AnimationPeriod
    reset = true
  }

  this.value = value
  this.time = now

  return reset
}

AnimationController.prototype.UpdateTarget = function() {

  //Calculate current position
  //this.UpdateValue()

  if (this.ManualUpate != null)
  {
    console.log("Manual!");
    this.target.style[this.property] = this.formula.replace("%value%",this.value)
    return
  }

  //Calculate and set the transition target.

  var transition_target = this.value + this.transition_duration * this.GetSpeed()
  this.target.style[this.property] = this.formula.replace("%value%",transition_target)
}


AnimationController.prototype.Update = function(){

  var reset = this.UpdateValue()

  if (this.ManualUpate != null)
    this.SetManualUpdates(false)

  if (reset)
  {
    this.SetManualUpdates(true)
    this.UpdateTarget(true)
    return
  }

  this.UpdateTarget(false)

}



AnimationController.prototype.SetTransition = function(state){
  if (state){
    this.target.style.transition = this.property + " linear "+this.transition_duration + "s"
    var tmp = this.target.offsetHeight
  }
  else {
    //console.log("Turning off");
    this.target.style.transition = "none"
    var tmp = this.target.offsetHeight
  }
  this.transition = state
}


AnimationController.prototype.SetManualUpdates = function(state){
  if (state) {
    this.SetTransition(false)
    if (this.ManualUpate == null)
      this.ManualUpate = setInterval(this.animator,35,this)
  }
  else if (this.ManualUpate != null){
    this.SetTransition(true)
    clearInterval(this.ManualUpate)
    this.ManualUpate = null
  }

}

AnimationController.prototype.Reset = function(){
  this.SetManualUpdates(true)
  this.SetTransition(false)
  //value = value % this.AnimationPeriod
}

AnimationController.prototype.SetSpeed = function(speed){

  this.UpdateValue()
  this.oldspeed = this.speed
  this.speed = speed
  this.SpeedUpdate = Date.now()
  this.UpdateValue()
  this.UpdateTarget()

}

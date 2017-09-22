var Mass = require('./Easing/Mass')

var AnimationController = module.exports = function (target, property, formula) {
  this.self = this
  this.time = Date.now();
  this.value = 0.0
  this.speed = 0.0
  this.timer = setInterval(this.animator,250,this)
  this.target = target
  this.property = property

  if (formula == undefined){

    formula = "%value%"
  }

  this.formula = formula
  this.transition_duration = 20
  this.transition = false

  this.SetTransition(true);

  this.AnimationPeriod = 60

  this.ManualUpate = null

  this.GetSpeed = this.NoEase

  this.ease_duration = 2
  this.oldspeed = 0.0
  this.SpeedUpdate = 0

}



AnimationController.prototype.animator = function(self,manual) {

  //var transition_duration = this.target.style["transition-duration"]
  self.Update(self)

}

AnimationController.prototype.NoEase = function() {
  return this.speed
}

AnimationController.prototype.LinearEase = function() {

  //console.log(this.speed,this.oldspeed,this.speedChange,this.ease_duration);
  var change = this.speed - this.oldspeed
  var delta = (Date.now()) - this.SpeedUpdate
  var percent = delta/(this.ease_duration * 1000)

  if (percent > 1)
    percent = 1

  console.log(change,delta,percent,this.oldspeed + change * percent);

  return this.oldspeed + change * percent
}

AnimationController.prototype.ApplyEasing = function() {
  this.easing = new Mass();
  this.easing.target_speed = this.speed;
}

AnimationController.prototype.UpdateValue = function() {
  var now = Date.now()

  var reset = false
  //Calculate the current position
  var deltatime = now - this.time;
  var value = this.value + ((deltatime/1000) * this.GetSpeed())

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

  this.UpdateTarget()

}

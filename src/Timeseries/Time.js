//Time class
var Time = module.exports = function (now) {
  this.update_time = (new Date).getTime()/1000;
  now = now || this.update_time
  this.time = now
  this.timescale = 1.0
  this.offset = 0
  this.realtimelimit = true
  this.callbacks = []
  this.timeobjects = []
  this.updatefrequency = 3

  //this.armtimer(this.time + this.updatefrequency)
  this.update()

}

Time.prototype.update = function(now) {


  now = (new Date).getTime()/1000;

  var delta = now - this.update_time
  var newtime = this.time + (delta * this.timescale)

  if (this.realtimelimit && newtime > now)
    newtime = now

  var nextcallback = this.triggercallbacks(newtime)

  this.update_time = now
  this.time = newtime


  //console.log(this.time);

  this.armtimer(nextcallback)



  return this.time

}

Time.prototype.timer = function(self) {
  self.update()
}

Time.prototype.triggercallbacks = function(newtime) {


  var callback
  var nextcallback = null
  var n,i

  n = this.callbacks.length
  for (i=0; i < n;i++){
    callback = this.callbacks[i]

    //Callback (and all remaining ones) is in the future
    if (callback.time > newtime) {
      nextcallback =  callback.time
      break;
    }

    //Call callback and pop it.
    callback.call(callback.time)
    this.callbacks.shift()

  }

  n = this.timeobjects.length
  for (i=0; i < n;i++){
    if (newtime < this.timeobjects[i].prev || newtime > this.timeobjects[i].next)
      this.timeobjects[i].update(newtime)
  }

  return nextcallback
}

Time.prototype.armtimer = function(nextcallback) {

    var delta

    if (this.scale == 0 || nextcallback == null)
      delta = this.updatefrequency
    else
      delta = (nextcallback - this.time) / this.timescale

    //console.log(nextcallback,delta);

    if (delta > this.updatefrequency)
      delta = this.updatefrequency

    if (typeof(this.tmrid) !== undefined)
      clearTimeout(this.tmrid)

    this.tmrid = setTimeout(this.timer,delta*1000,this);


}

Time.prototype.addcallback = function(time,callback) {
  this.callbacks.push(element);
  this.callbacks.sort(function(a, b) {
    return a.time - b.time;
  });

  //Is this the next one then arm timer?
  if (this.callbacks[0].time = time)
    this.armtimer(time)
}

Time.prototype.setscale = function(scalefactor) {
  this.update()
  this.scale = scalefactor
  this.update()

}

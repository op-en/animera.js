//Time class
var Time = module.exports = function (now) {
  this.update_time = (new Date).getTime()/1000;
  now = now || this.update_time
  this.time = now
  this.timescale = 1.0
  this.prevtimescale = 1.0
  this.settingchanged = true
  this.offset = 0
  this.realtimelimit = true
  this.callbacks = []
  this.timeobjects = []
  this.updatefrequency = 3

  //this.armtimer(this.time + this.updatefrequency)
  this.update()

}

Time.prototype.getTime = function(at) {

  if (at === undefined)
    at = (new Date).getTime()/1000;

  var delta = at - this.update_time
  var newtime = this.time + (delta * this.timescale)

  return newtime
}

Time.prototype.update = function() {


  var now = (new Date).getTime()/1000;


  var newtime = this.getTime(now)

  if (this.realtimelimit && newtime > now)
    newtime = now

  this.triggercallbacks(newtime)

  this.update_time = now
  this.time = newtime


  //console.log(this.time);

  this.armtimer()



  return this.time

}

Time.prototype.updateprev = function(ts) {

  var now = this.getTime()


  if (ts < now && ts > this.prev) {
    //this.prev = ts
    this.update()
  }

}

Time.prototype.updatenext = function(ts) {
  var now = this.getTime()

  if (ts > now && ts < this.next) {
    //this.prev = ts
    this.update()
  }
}



Time.prototype.timer = function(self) {
  self.update()
}

Time.prototype.triggercallbacks = function(newtime) {


  var callback
  var delta
  var deltanext = Infinity
  var deltaprev = Infinity * -1
  var n,i

  // n = this.callbacks.length
  // for (i=0; i < n;i++){
  //   callback = this.callbacks[i]
  //
  //   //Callback (and all remaining ones) is in the future
  //   if (callback.time > newtime) {
  //     nextcallback =  callback.time
  //     break;
  //   }
  //
  //   //Call callback and pop it.
  //   callback.call(callback.time)
  //   this.callbacks.shift()

  //}

  n = this.timeobjects.length
  for (i=0; i < n;i++){

    try {

      if (newtime < this.timeobjects[i].prev || newtime > this.timeobjects[i].next || (this.settingchanged))
      {
        this.settingchanged = false
        this.timeobjects[i].update(newtime,this)
      }
      delta = this.timeobjects[i].prev - newtime

      if (deltaprev < delta)
        deltaprev = delta

      delta = this.timeobjects[i].next - newtime

      if (deltanext > delta)
        deltanext = delta

    }
    catch(e){
      console.log("Error in timeobject:" + i + " " + this.timeobjects[i]);
      continue
    }

  }

  this.next = newtime + deltanext
  this.prev = newtime + deltaprev

  //console.log(this.prev,newtime,this.next,deltaprev,deltanext);

  return
}



Time.prototype.armtimer = function() {

    var delta

    if (this.timescale == 0)
      delta = this.updatefrequency
    else if (this.timescale > 0)
      delta = (this.next - this.time) / this.timescale
    else
      delta = (this.prev - this.time) / this.timescale

    //console.log("TMR: " + delta);

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

Time.prototype.addtimeobject = function(timeobject) {
  var n,i

  n = this.timeobjects.length

  for (i=0;i<n;i++) {
    if (this.timeobjects[i] == timeobject)
      return fasle
  }

  this.timeobjects.push(timeobject)

  this.update()
}

Time.prototype.setscale = function(scalefactor) {
  this.update()
  this.timescale = scalefactor
  this.settingchanged = true
  this.update()

}

Time.prototype.settime = function(time) {
  this.update()
  this.time = time
  this.update_time = (new Date()).getTime()/1000
  this.settingchanged = true
  this.update()

}

Time.prototype.pause = function(scalefactor) {
  this.prevtimescale = this.timescale
  this.setscale(0)
}

Time.prototype.play = function(scalefactor) {
  this.setscale(this.prevtimescale)
}

Time.prototype.pauseandrevind = function() {
  this.setscale(0)
  this.settime(0)
}


// WIKIPEDIA:   In navigation, dead reckoning or dead-reckoning (also ded for deduced reckoning or DR) 
//is the process of calculating one's current position by using a previously determined position, or fix, 
//and advancing that position based upon known or estimated speeds over elapsed time and course. 
//The corresponding term in biology, used to describe the processes by which animals update their estimates 
//of position or heading, is path integration.

//SCOPE: This code aima so keep a realtime variable our counter at the correct value even if update frequency of the value
//is lower than the rate at wich the value changes. 

//A typical example is power consumption where we want to have a meter counter which counts the current energy consumption
//Given the absolute value of the counter at a given time and the rate of change i.e. the power this class will progress the 
//meter value in accorance with the rate/power.    


var DeadReckoning = module.exports = function (callback,time_property,value_property,rate_property,update_fq,update_delta,timeout,goback) {


	this.callback = callback;
	this.value_property = value_property;
	this.rate_property = rate_property;
	this.time_property = time_property;
	this.update_fq = update_fq;
	this.update_delta = update_delta;
	this.timeout = timeout;
	thi.goback = goback;

	if (typeof this.goback === 'undefined') {
		this.goback = false;
	}

	if (typeof this.timeout === 'undefined') {
		this.timeout = 60;
	}

	if (typeof this.value_property === 'undefined') {
		this.value_property = "value";
	}

	if (typeof this.rate_property === 'undefined') {
		this.rate_property = "rate";
	}

	if (typeof this.time_property === 'undefined') {
		this.time_property = "time";
	}

	if (typeof this.update_fq === 'undefined') {
		this.update_fq = null;
	}

	if (typeof this.update_delta === 'undefined' ) {
		if (this.update_fq == null)
			this.update_delta = 1.0;
		else
			this.update_delta = null;
	}

	
	this.value = 0;
	this.rate = 0;
	this.timestamp = 0;

	this.current = 0;
	this.interpolation_time = 0;

	this.timer = null;

	return this;

}


DeadReckoning.prototype.reckon = function {

	var now = (new Date).getTime()/1000.0;
	var delta = now - this.timestamp;
	var wait = 0;

	//Clear timers
    if (this.timer != null) {
  	  clearTimeout(this.timer);
  	  this.timer = null;
    }

	//If the data is to old do nothing.
	if (delta > this.timeout)
	{
		return;
	}

	//Calculate current value
	current = self.value + (self.rate*delta);
	interpolation_time = now;

	//Wait if prevous calculations overshoot the current and the goback setting is false. 
	if (this.goback == false && current < this.current) {
		//Wait unil the value catches up with the derived value. 
		wait = (this.current - current)/self.rate;
		this.timer = setTimeout(function (reckon) { reckon(); }, wait * 1000, this.reckon);
		return; 
	}

	this.current = current;
	this.interpolation_time = now;
	callback(this.topic, JSON.stringify(   { this.time_property:this.interpolation_time,this.value_property:current,this.rate_property:this.rate }   ));

	//Calculate next update. 
	if (this.update_fq != null) {
		wait = this.update_fq;
	}
	else if (this.update_delta != null) {
		var ttnext = this.update_delta/this.rate;

		if (ttnext < wait)
			wait = ttnext;
	}
	else {
		return;
	} 
	
	this.timer = setTimeout(function (reckon) { reckon(); }, wait * 1000, this.reckon);	
}

DeadReckoning.prototype.mqtt = function (topic, payload) {

  var newdata

  //Avoid looping messages
  if (topic == this.result_topic)
  	return;

  this.topic = topic;

  //Parse data
  payload = JSON.parse(payload);
  rate = parseFloat(payload[this.rate_property]);
  value = parseFloat(payload[this.value_property]);
  timestamp = parseFloat(payload[this.time_property]);

  //All parameters read save for later.
  this.value = value;
  this.rate = rate;
  this.timestamp = timestamp;

  
 
  //Calculate current and next value to send 
  this.reckon()





  
}
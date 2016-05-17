//visa.js
//This code was created by the open energy playground project 2016. 



//OpenEnergy Appserver
var AppClient = function (url) {
  this.io = io.connect(url);
  this.io.appclient = this;
  this.connected = false;
  this.subscribers = {};
  this.retention = {};
  this.rotations = [];
  this.autobindings = null;
  this.autoid = 0;
  this.sourcetype = "op-en_appserver";
  this.source_address = url;
  this.debug = true;
  this.lock=0;

  var d = new Date();

  this.lastupdate = d.getTime();

  this.timer = setInterval(function(appclient){ 

    //Get time.
    var d = new Date();
    var n = d.getTime();
    var delta = n - appclient.lastupdate;

    appclient.lastupdate = n;

    //Call all animation functions. 
    var arrayLength = appclient.rotations.length;

    for (var i = 0; i < arrayLength; i++) {
      appclient.rotations[i].update(delta);
    }

  

  }, 30, this);
  
  if (this.debug)
    console.log('AppServer instantiated');


  //Handle incomming MQTT messages
  this.io.on('mqtt', function (msg) {

    if (this.appclient.debug) {
      console.log("RECIVED: " + msg.topic + " : " + msg.payload);
    }
    // 

    //Any subscribers?
    for (var topic in this.appclient.subscribers) {

      //Match topics hand # sign
      
      //If topic end with # and msg.topic contains topic -1 char then call handlers
      if (topic.slice(-1) == "#" ) {
          if (msg.topic.indexOf(topic.slice(0,-1)) == 0) {
            var handlers = this.appclient.subscribers[topic];

            var arrayLength = handlers.lenght;

            for (var i = 0; i < arrayLength; i++) {
              handlers[i](msg.topic,msg.payload);
            }
          }

      } 
      //If topic does not contain # and is exact match with msg.topic call all handlers.
      else if (topic == msg.topic) {

        //console.log(topic);

        var handlers = this.appclient.subscribers[topic];

        for (var i = 0; i < handlers.length; i++) {
          handlers[i](msg.topic,msg.payload);
        }
      }      
    }


    //Update retention
    this.appclient.retention[msg.topic] = msg.payload;

  });

  //Handle connection.
  this.io.on('connect', function () {
    if (this.appclient.debug) {
      console.log(this.appclient.sourcetype + " connection established to " + this.appclient.source_address);
    }
    this.appclient.connected = true;

    
    for (var topic in this.appclient.subscribers) {
      console.log("Subscribing to " + topic);
      this.emit('subscribe',{"topic":topic});
    }

    //Subscribe

  });
  
  //return this;
};

//Add a function that handles incomming MQTT data
AppClient.prototype.subscribe = function (topic, handler) {

    var d = new Date();
    var n = d.getTime();

    this.lock++;


    if (this.lock > 1)
      console.log("Bang!!");

    console.log(n);

    //Check if topic exists
    if (! (topic in this.subscribers)) {

      //console.log("new topic");

			//If not add topic and handler to subscribers list. 
      this.subscribers[topic] = [handler];

      //Subscribe to data. 
      if (this.connected) {
        console.log("Subscribing to " + topic);
      	this.io.emit('subscribe',{"topic":topic});
      }
    }
    else {
    	// Otherwise just add handler to subscriber list
    	this.subscribers[topic].push(handler);
      
      //And send old data if any.
      if (topic in this.retention) {
        handler(topic, this.retention[topic]);
      }

    }

    console.log(this.lock);
    console.log(n);

    this.lock--;
    
};

AppClient.prototype.subscribe_to_subproperty = function (topic,  subproperty, handler) {

  if (typeof(subproperty)==='undefined') subproperty = null;

  this.subscribe(topic,function(topic,payload){
    if (subproperty != null) {
        payload = JSON.parse(payload);

        //console.log(payload);

        var data = payload[subproperty];

        //console.log(data);

    }
    else {

        var data = payload;
      
    }

    // Only if string. 
    handler(topic,data);
    

  });



};

//Add a connection to set an text element to incomming MQTT data. 
//Topic is the mqtt topic
//element is the id of an html element. 
//If mqtt data is Json the optional subproperty can be used to get a specific property of the data. 
AppClient.prototype.bind_topic_to_html = function (element ,topic,  subproperty, unit) {

  if (typeof(subproperty)==='undefined') subproperty = null;
  if (typeof(unit)==='undefined') unit = "";

  if (typeof element === 'string' || element instanceof String) 
    element = document.getElementById(element);

  this.subscribe(topic,function(topic,payload){
    if (subproperty != null) {
        payload = JSON.parse(payload);

        console.log(payload);

        var data = payload[subproperty];

        console.log(data);

    }
    else {

        var data = payload;
      
    }

    // Only if string. 
    element.innerHTML = "" + data + unit;
    

  });



};


AppClient.prototype.bind_topic_to_style = function (element ,topic, style, subproperty) {

  if (typeof(subproperty)==='undefined') subproperty = null;

  if (typeof element === 'string' || element instanceof String) 
    element = document.getElementById(element);

  this.subscribe(topic,function(topic,payload){
    if (subproperty != null) {
        payload = JSON.parse(payload);

        

        var data = payload[subproperty];

        

    }
    else {

        var data = payload;
      
    }

    // Only if string. 
    element["style"][style] = "" + data;
    

  });

};




//New version
AppClient.prototype.bind_topic_to_rotation = function (element, topic, relative, subproperty, input_range, output_range, clamp) {

  if (typeof(relative)==='undefined') relative = true;
  if (typeof(subproperty)==='undefined') subproperty = null;

  if (typeof(input_range)==='undefined') input_range = null;
  if (typeof(output_range)==='undefined') output_range = null;
  if (typeof(clamp)==='undefined') clamp = false;


  //Creation animantion object. 
  var rotation = new Rotation(element,relative,subproperty);

  if (input_range != null && output_range != null) {
    rotation.input_m = (output_range[1] - output_range[0]) / (input_range[1] - input_range[0]); 
    rotation.input_c = output_range[0] - (rotation.input_m * input_range[0]);
  }


  if (clamp == true && input_range != null) {
    input_range.sort();
    rotation.input_max = input_range[1];
    rotation.input_min = input_range[0];
  }



  this.rotations.push(rotation);

  //Add update function.
  this.subscribe(topic,function(topic,payload){rotation.mqtt(topic,payload);} );

  return rotation;

};

AppClient.prototype.autobind = function (mydoc,class_name) {

  if (typeof(mydoc)==='undefined') mydoc = document;

  if (typeof(class_name)==='undefined') class_name = null;
  
  //Use a specific class name or just look for mqtt atrribute. 
  if (class_name == null) {
    var list = mydoc.querySelectorAll('[mqtt]');
  } 
  else {
    var list = mydoc.getElementsByClassName(class_name);
  }

  //Iterate all elements found. 
  var arrayLength = list.length;

  for (var i =0; i < arrayLength;i++) {

    //Already set?
    if (list[i].hasOwnProperty("mqtt")) {
      continue;
    }

    //Get parameter
    var parameters = list[i].getAttribute("mqtt");

    //Return if not present. 
    if (parameters == null) {
      continue;
    } 
  

    //Only allow bind functions to be called. 
    if (parameters.indexOf("bind") != 0)
      continue;

    if (list[i].id == "" ) {
      //console.log("No id");
      list[i].id = "_mqtt_" + this.autoid;
      //console.log(list[i].id);  
      this.autoid = this.autoid + 1;
    }

    //Insert id automatically
    if (parameters.indexOf("\"" + list[i].id + "\"") == -1) {
      parameters = parameters.replace("(","(\"" + list[i].id + "\", " );

    }

    if (this.debug)
      console.log("Adding binding: " + parameters);

    list[i].mqtt = eval("this."+parameters);


  }

 // if (this.autobindings == null) {

  //}

};

AppClient.prototype.autobind_after_page_load = function (mydoc,class_name) {


  mydoc.addEventListener('DOMContentLoaded', function() {
     // 
     this.autobind(class_name);
  }, false);

}


var Rotation = function (id,relative,subproperty) {

  if (typeof(relative)==='undefined') relative = true;
  if (typeof(subproperty)==='undefined') subproperty = null;

  if (typeof id === 'string' || id instanceof String) {
    this.id = id;
    this.element = document.getElementById(id);
  }
  else {
    this.element = id;
    this.id = this.element.id;
  }

  
  this.subproperty = subproperty;
  this.relative = relative;

  this.target_value = 0;
  this.position = 0;
  this.speed = 0;
  this.force = 0.01;
  this.mass = 100;
  this.max_speed = 0.0;
  this.stop_speed = 0.004;

  this.input_m = 1;
  this.input_c = 0;
  this.input_max = null;
  this.input_min = null;


  this.finnished = true;
  

  return this;

}

//Called x times per second to preform the animation. 
Rotation.prototype.update = function (delta_time) {

  var change;

  if (this.relative == false) {
    return;
    //change = this.update_direction(delta_time);
  } 
  else {
    change = this.update_rotation(delta_time);
  }

  this.position = this.position + change;

  this.setvalue();

};

Rotation.prototype.update_rotation = function (delta_time) {

  var f,speed_change,change,diff;

  f = this.force;
  diff = this.max_speed - this.speed;

  //Run only if we are in progress of changing speed. 
  if (diff != 0) {

    if (diff < 0) {  
      f = f * -1;
    }

    speed_change =  (f / this.mass) * delta_time;

    if ((speed_change > diff && diff >= 0) || (speed_change < diff && diff < 0)) {
      speed_change = diff;
    }

    this.speed = this.speed + speed_change;

  }

  change = this.speed * delta_time;

  //console.log(diff + " " + change);

  return change;

};

Rotation.prototype.update_direction = function (delta_time) {

};

//New incomming data. 
Rotation.prototype.mqtt = function (topic,payload) {

  

  if (this.subproperty == null)
  {
      var newdata = parseFloat(payload);
  }
  else {
    payload = JSON.parse(payload);

    var newdata = payload[this.subproperty];

  }

  
  

  //Clamp data:
  if (this.input_max != null) {
    if (newdata > this.input_max) {
      newdata = this.input_max;
    }
  }

  if (this.input_min != null) {
    if (newdata < this.input_min) {
      newdata = this.input_min;
    }
  }

  

  //Translate data. 
  newdata =  this.input_m * newdata + this.input_c;


  if (this.relative == true) {

  //console.log(payload);
  //console.log(newdata);

    if (newdata != this.max_speed) {
      this.max_speed = newdata;
      this.finnished = false;
    }

  } else {  

    if (newdata != this.target_value) {
      this.target_value = newdata;
      this.finnished = false;

      this.position = this.target_value;
      this.setvalue();
    }
     
  }



};

Rotation.prototype.setvalue = function () {

  this.position = this.position % 360;

  this.element.style.webkitTransform = 'rotate('+this.position+'deg)'; 
  this.element.style.mozTransform    = 'rotate('+this.position+'deg)'; 
  this.element.style.msTransform     = 'rotate('+this.position+'deg)'; 
  this.element.style.oTransform      = 'rotate('+this.position+'deg)'; 
  this.element.style.transform       = 'rotate('+this.position+'deg)'; 

};


//Datahub class manages data sources and data feeds. 
var DataHub = function () {
  this.datasources = {"op-en_appserver":AppClient};
  this.datainstances = [];
};

DataHub.prototype.getdatasource = function (sourcetype,url) {
  nsources = this.datainstances.length;

  //Iterate all instances. 
  for (var i = 0; i < nsources; i++) {
    if (this.datainstances[i].sourcetype == sourcetype && this.datainstances[i].source_address == url) {
      return this.datainstances[i];
    }
  }

  //Nothing found then create. 
  var new_datasource = new this.datasources[sourcetype](url);

  //And add to list. 
  if (typeof new_datasource !== 'undefined') {
    this.datainstances.push(new_datasource);
  }

  return new_datasource

}


///MAIN

//Find top most window. 
var topmost = window; 

while (topmost != topmost.parent) {
  topmost = topmost.parent
}

//Does an instace exist? 
if (!topmost.parent.hasOwnProperty("datahub")) {

  var d = new Date();
  var n = d.getTime();

  if (!topmost.parent.hasOwnProperty("_datahub_loading")) {
    topmost._datahub_loading = n;

    if (n == topmost._datahub_loading) {
      //Attatch singeton instance. 
      topmost.datahub = new DataHub();

      console.log("Datahub created at timestamp: " + n)
    }

  } 
}


console.log("rtd-viz.js loaded");





var time = require('./Time')

//DataSeries class
var DataSeries  = function (time_object,server,topic) {
  this.time = time_object
  this.source = {"server" : server, "topic":topic}
  this.callbacks = []
  this.destination = {"topic":null,"local":true}

  this.meta = {}

  this.dataoffset = null
  this.datarescale = null

}


DataSeries.prototype.GetCurrentValues = function(at) {
  return [0,0,0]
}

//DataSeriesBuffer inherents from dataseries.
var DataSeriesBuffer =  function (time_object,server,topic) {
  DataSeries.call(this, time_object,server,topic);

  this.relativetime = false
  this.starttime = 0
  this.stoptime = 0
  this.length = 0

  this.autoload = false
  this.autoloadthreshhold = null

  this.url = ""
  this.topic = ""
  this.data = [];
  this.currentIndex = null;
  this.prev = 1;
  this.next = -1;

}

DataSeriesBuffer.prototype.update = function(now) {

}

DataSeriesBuffer.prototype.getIndex = function(ts) {

  var dir
  var currenttime, currentindex
  var newindex

  currentindex = this.currentIndex

  //If index is set to a linjear search from it.
  if (currentindex != null) {

    currenttime = this.data[currentindex][0];

    //In the past
    if (currenttime > ts) {
      newindex = currentindex - 1

      //No data.
      if (newindex < 0)
        return null

      if (this.data[newindex][0] <= ts)
        return newindex
    }
    //Or future
    else {
      newindex = currentindex + 1
      //No data.
      if (newindex >= this.data.length)
        return null

      if (this.data[newindex][0] > ts)
        return currentindex
    }
  }
  //Else do a bubble search

}


DataSeriesBuffer.prototype.LoadJSON = function(url) {
  this.url = url
  var self = this
  this.getJSON(url,function (status,response){ self.incommingJSON(status,response) })
  //console.log("Requesting");
}



DataSeriesBuffer.prototype.incommingJSON = function(status,response) {
  //console.log(this);
  //console.log(status);
  //console.log(response)
  //this.response = response
  this.data = response.Data
  this.meta = response.Meta
}

DataSeriesBuffer.prototype.getJSON = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
      var status = xhr.status;
      if (status === 200) {

        callback(null, xhr.response);
      } else {
        callback(status, xhr.response);
      }
    };
    xhr.send();
};



//DataSeriesModifier inherents from dataseries.
var DataSeriesModifier = module.exports = function (time_object,server,topic) {
  DataSeries.call(this, time_object,server,topic);
  this.dataseries = [];
  this.operation = "sum"
}


var Timeseries = module.exports = {DataSeries,DataSeriesBuffer}

var time = require('Time')

//DataSeries class
var DataSeries = module.exports = function (time_object,server,topic) {
  this.time = time_object
  this.source = {"server" : server, "topic":topic}
  this.callbacks = []
  this.destination = {"topic":null,"local":true}

  this.meta = {}

  this.dataoffset = null
  this.datarescale = null



}

AppClient.prototype.recieve = function(GetCurrentValues) {
  return [0,0,0]
}

//DataSeriesBuffer inherents from dataseries.
var DataSeriesBuffer = module.exports = function (time_object,server,topic) {
  DataSeries.call(this, time_object,server,topic);

  this.relativetime = false
  this.starttime = 0
  this.stoptime = 0
  this.length = 0

  this.autoload = false
  this.autoloadthreshhold = null

  this.data = [];

}

//DataSeriesModifier inherents from dataseries.
var DataSeriesModifier = module.exports = function (time_object,server,topic) {
  DataSeries.call(this, time_object,server,topic);
  this.dataseries = [];
  this.operation = "sum"
}

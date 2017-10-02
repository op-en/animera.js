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

  this.offsets = null
  this.rescales = null

  this.time.addtimeobject(this)
}

DataSeries.prototype.ApplyModifiers = function(data) {
  //Make copy
  var modifieddata = data.slice()
  var n,i

  if (this.offsets != null){
    n = this.offsets.length

    if (n > data.lenght)
      n =  data.lenght

    for (i=0;i<n;i++){
      modifieddata[i] = modifieddata[i] + this.offsets[i]
    }

  }

  if (this.rescales != null){
    n = this.rescales.length

    if (n > data.lenght)
      n =  data.lenght

    for (i=0;i<n;i++){
      modifieddata[i] = modifieddata[i] * this.rescales[i]
    }

  }

  return modifieddata

}

DataSeries.prototype.moveto = function(at) {

  if (at === undefined)
    at = this.time.getTime()

  var firsttimestamp = this.getOriginalDataAtIndex(0)[0]

  if (firsttimestamp == null)
    return false

  var offset = at - firsttimestamp

  if (this.offsets == null)
    this.offsets = []

  this.offsets[0] = offset

  this.update(true)
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

DataSeriesBuffer.prototype = Object.create(DataSeries.prototype)
DataSeriesBuffer.prototype.constructor = DataSeriesBuffer

DataSeriesBuffer.prototype.GetValues = function(at) {

  var index = this.getIndex(at)

  if (index == -1)
    return null

  return this.getDataAtIndex(index)
}

DataSeriesBuffer.prototype.update = function(now) {


var forceupdate = false

  if (now == true)  {
    now = this.time.getTime()
    forceupdate = true
    console.log("Forcing update");
  }
  if (now === undefined)
    now = this.time.getTime()

  var currentIndex = this.getIndex(now)


  if (currentIndex == this.currentIndex  && forceupdate == false)
    return

  this.currentIndex = currentIndex
  var nextdata = this.getDataAtIndex(this.currentIndex+1)
  var prevdata = this.getDataAtIndex(this.currentIndex)

  if (nextdata == null)
    this.next = Infinity
  else {
    this.next = nextdata[0]
    this.time.updatenext(this.next)
  }

    if (prevdata == null)
      this.prev = -1 * Infinity
    else{
      this.prev = prevdata[0]
      this.time.updateprev(this.prev)
    }



  console.log(this.currentIndex);
}

DataSeriesBuffer.prototype.getDataAtIndex = function(index) {
  var data = this.getOriginalDataAtIndex(index)
  //console.log(data);
  if (data == null)
    return null
  return this.ApplyModifiers(data)
}

DataSeriesBuffer.prototype.getOriginalDataAtIndex = function(index) {
  if (index == null)
    return null

  if (index < 0)
    return null

  if (index >= this.data.lenght)
    return null

  return this.data[index]

}

DataSeriesBuffer.prototype.getIndex = function(ts) {

  var dir
  var currenttime, currentindex
  var newindex

  if (ts === undefined)
    ts = this.time.getTime()

  if (this.offsets != null)
    ts = ts - this.offsets[0]

  if (this.rescales != null && this.rescales[0] != 0)
    ts = ts/this.rescales[0]

  currentindex = this.currentIndex

  //If index is set to a linjear search from it.
  if (currentindex != null && currentindex > 0 && currentindex < this.data.length) {

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
  //Else do a binary search
  currentindex = binarySearch(this.data,ts,function(a,b){
    return a - b[0]
  })

  //if (currentindex == -1)
  //  return null

  //if (currentindex == this.data.length - 1)
  //  return null

  return currentindex
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

  this.update(true)

  console.log("Loaded " + response.Data.length + " rows of data");
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



function binarySearch(ar, el, compare_fn) {
    var m = 0;
    var n = ar.length - 1;
    while (m <= n) {
        var k = (n + m) >> 1;
        var cmp = compare_fn(el, ar[k]);
        if (cmp > 0) {
            m = k + 1;
        } else if(cmp < 0) {
            n = k - 1;
        } else {
            return k;
        }
    }
    return m - 1;
}

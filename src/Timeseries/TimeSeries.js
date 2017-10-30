var time = require('./Time')

//DataSeries class
var DataSeries  = function (time_object,server,topic) {
  this.time = time_object

  this.formating = {
    chartjs:function(v){
        //console.log(v);
        return {"x":v[0]*1000,"y":v[1]}
      }

  }

  this.source = {"server" : server, "topic":topic}
  this.callbacks = []
  this.destination = {"topic":null,"local":true}

  this.meta = {}

  this.events = {}
  this.events.newdata = function(){}

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

DataSeries.prototype.getData = function(at) {
  return this.getDataAtIndex(this.getIndex(at))
}



//DataSeriesBuffer inherents from dataseries.
var DataSeriesBuffer =  function (time_object,server,topic) {
  DataSeries.call(this, time_object,server,topic);
  this.relativetime = false
  this.starttime = 0
  this.stoptime = 0
  this.length = Infinity

  this.autoload = false
  this.autoloadthreshhold = null

  this.url = ""
  this.topic = ""
  this.buffer = [];
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

DataSeriesBuffer.prototype.GetFormattedPeriod = function(from,to,format) {
  if (format === undefined)
    format = function(values){ return values}

  var fromIndex = this.getIndex(from)
  var toIndex = this.getIndex(to)
  var rows = (toIndex - fromIndex)+1
  var cols = this.meta.Keys.length

  if (fromIndex == -1)
    fromIndex = 0

  //Empty result
  if (rows < 0 )
    return []

  //Allocate matrix.
  var result = new Array(rows);
  //for (var i = 0; i < rows; i++) {
  //  result[i] = new Array(cols);
  //}

  //console.log("Index: ",fromIndex,toIndex);

  for (var i = 0; i < rows; i++) {
    //console.log("i rows ",i,rows)
    result[i] = format(this.ApplyModifiers(this.buffer[fromIndex + i]))
    //console.log(result[i]);
    //console.log(this.buffer[fromIndex + i],fromIndex + i);


  }

  return result
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



  //console.log(this.currentIndex);
}

DataSeriesBuffer.prototype.getDataAtIndex = function(index) {
  var data = this.getOriginalDataAtIndex(index)
  //console.log(data);
  if (data == null)
    return null
  return this.ApplyModifiers(data)
}

DataSeriesBuffer.prototype.getPeriod = function() {

  var n = this.buffer.length
  if (n == 0)
    return []

  var first = this.getDataAtIndex(0)

  if (n == 1)
    return [first[0],first[0]]

  var last = this.getDataAtIndex(n-1)

  return [first[0],last[0]]
}

DataSeriesBuffer.prototype.getOriginalDataAtIndex = function(index) {
  if (index == null)
    return null

  if (index < 0)
    return null

  if (index >= this.buffer.lenght)
    return null

  return this.buffer[index]

}

DataSeriesBuffer.prototype.getRelativeIndex = function(ts) {
  //console.log(ts,this.time.getTime());
  ts = ts + this.time.getTime()
  //console.log(ts);
  return this.getIndex(ts)
}

DataSeriesBuffer.prototype.getIndex = function(ts) {
  //console.log(ts);
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
  if (currentindex != null && currentindex >= 0 && currentindex < this.buffer.length) {
    //console.log("Index"+currentindex);
    currenttime = this.buffer[currentindex][0];

    //In the past
    if (currenttime > ts) {
      newindex = currentindex - 1

      //No data.
      if (newindex < 0)
        return -1

      if (this.buffer[newindex][0] <= ts) {
        //console.log("linjear past")
        return newindex
      }
    }
    //Or future
    else {
      newindex = currentindex + 1
      //No data.
      if (newindex > this.buffer.length-1)
        return currentindex

      if (this.buffer[newindex][0] > ts) {
        //console.log("linjear future");
        return currentindex
      }
    }
  }

  //Else do a binary search
  currentindex = binarySearch(this.buffer,ts,function(a,b){
    return a - b[0]
  })

  //if (currentindex == -1)
  //  return null

  //if (currentindex == this.buffer.length - 1)
  //  return null
  //console.log("binary:"+currentindex);
  return currentindex
}


DataSeriesBuffer.prototype.LoadJSON = function(url,callback) {
  this.url = url
  var self = this
  this.onloaded = callback

  this.getJSON(url,function (status,response){ self.incommingJSON(status,response) })
  //console.log("Requesting");
}

DataSeriesBuffer.prototype.incommingJSON = function(status,response) {
  //console.log(this);
  //console.log(status);
  //console.log(response)
  //this.response = response
  this.buffer = response.Data
  this.meta = response.Meta

  this.update(true)

  if (typeof(this.onloaded) === 'function')
    this.onloaded(this)

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

DataSeriesBuffer.prototype.subscribe = function(server,topic) {
  //if (typeof (this.source.server) === undefined)
  //    return false

  this.source.topic = topic
  this.source.server = server
  //console.log("Topic:"+topic);
  var obj = this;
  this.source.server.subscribe(topic,function (topic, payload) {
    //console.log("callback");
    obj.updatedata(topic,payload)

  })

  return true
};

DataSeriesBuffer.prototype.updatedata = function(topic,payload) {
  //console.log(topic,payload);
  try {
    payload = JSON.parse(payload)
  }
  catch (e) {
      //console.error(e)
    return
  }

  var keys = Object.keys(payload)
  var values = Object.values(payload)

  //console.log(keys);
  //console.log(values);

  //Set keys if not already set.
  if (this.meta.Keys === undefined)
    this.setkeys(keys)

  var n = values.length;
  var dataarray = new Array(n);

  var keyindex = 0
  for (var i=0; i<n;i++) {
    keyindex = this.meta.Keys.indexOf(keys[i])

    //Missing key
    if (keyindex < 0) {
      keyindex = this.addkey(keys[i])
    }

    dataarray[keyindex]=values[i]
  }

  this.insertdata(dataarray)

  //Activate callback
  if (this.events.newdata !== undefined)
    this.events.newdata(this,dataarray)

};

DataSeriesBuffer.prototype.insertdata = function(dataarray) {
  var index = this.getIndex(dataarray[0]) + 1
  //console.log(index,this.getIndex(dataarray[0]));
  this.buffer.splice(index, 0, dataarray);
  this.trim()
}



DataSeriesBuffer.prototype.trim = function(key) {


  var start,end
  if (this.relativetime) {
    start = this.getRelativeIndex(this.starttime ) - 2
    end = this.getRelativeIndex(this.stoptime) + 2
  }
  else {
    start = this.getIndex(this.starttime ) -2
    end = this.getIndex(this.stoptime) + 2
  }


  if (!isNaN(end))
    this.buffer.splice(end,Infinity)
  if (!isNaN(start))
    this.buffer.splice(0,start)

  if (this.length == Infinity)
    return

  console.log("Overflow");
  var overflow = this.buffer.length - this.length

  if (overflow > 0)
    this.buffer.splice(0,overflow)

}

DataSeriesBuffer.prototype.addkey = function(key) {
  this.meta.Keys.push(key)
  return this.meta.Keys.length-1
}
DataSeriesBuffer.prototype.setkeys = function(keys) {
  //Copy
  var keyscopy = keys.slice()

  //Make sure time is first
  var ntime = keyscopy.indexOf("time")
  if (ntime > 0) {

    //Move time to the beginning
    keyscopy.splice(ntime,1)
    keyscopy.unshift("time")
  }

  //Add to meta info.
  this.meta.Keys = keyscopy
}

DataSeriesBuffer.prototype.keyId = function(key) {
  var n = this.meta.Keys.length;

  for (var i=0; i<n; i++) {
    if (this.meta.Keys[i] == key)
      return i
  }

  return -1

}



//DataSeriesModifier inherents from dataseries.
var DataSeriesModifier = module.exports = function (time_object,server,topic) {
  DataSeries.call(this, time_object,server,topic);
  this.dataseries = [];
  this.operation = "sum"
}

//Module wrapper
var Timeseries = module.exports = {DataSeries,DataSeriesBuffer}

//Utility functions

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

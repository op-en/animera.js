

//Create a namespace
var widgetutils = {};


widgetutils.parseparams = function (paramArray) {

	//Default parameter that works in safari as well 
	if (typeof(paramArray)==='undefined') paramArray = {"server":"http://op-en.se:5000","topic":"test/topic1","subproperty":null,"max":10000};

	var href = document.defaultView.location.href;

  	//Get the url of myself and parse it for parameters. 
	if ( -1 != href.indexOf("?") )
	{
	var paramList = href.split("?")[1].split(/&|;/);
	for ( var p = 0, pLen = paramList.length; pLen > p; p++ )
	{
	   var eachParam = paramList[ p ];
	   var valList = eachParam.split("=");
	   var name = unescape(valList[0]);
	   var value = unescape(valList[1]);

	   paramArray[ name ] = value.replace("\"","").replace("\"","");
	 }
	}

	return paramArray;
}

widgetutils.getdatahub = function (name,resource_path,callback) {

	//Default parameter that works in safari as well 
	if (typeof(name)==='undefined') name = "datahub";
	if (typeof(resource_path)==='undefined') resource_path = widgetutils.path;
	if (typeof(callback)==='undefined') callback = init_widget;


	//Find top most window. 
	var topmost = window; 

	while (topmost != topmost.parent) {
		topmost = topmost.parent
	}

	//Check if we have a data library.
	if (!topmost.parent.hasOwnProperty(name)) {

		//Dynabically load libraries. 
		widgetutils.loadjsfile("https://cdn.socket.io/socket.io-1.4.5.js",function () { 
			console.log("socket.io loaded")

			widgetutils.loadjsfile(resource_path + "/animera.js", function () { 
				console.log("datahub loaded")
				callback(topmost[name]); 
			});
		});

		return;

	}

	//Call callback 
	callback(topmost[name]);

}



widgetutils.loadjsfile = function (filename, callback ) {

	//Default parameter that works in safari as well 
	if (typeof(callback)==='undefined') callback = function () {};
	
	var script = document.createElement('script');

	//console.log(typeof script);
	
	// most browsers
	script.onload = callback;
	// IE 6 & 7
	script.onreadystatechange = function() {
		if (this.readyState == 'complete') {
			callback();
		}
	}
	
	if (typeof script !== "undefined") {
        var dest = document.getElementsByTagName("head")[0];
        //console.log(dest);

        //HTML or pure SVG?
        if (typeof dest !== "undefined") {
        	script.type = 'text/javascript';
			script.src = filename;
        }
        else {
        	var dest = document.getElementsByTagName("svg")[0];
        	script["xlink:href"] = filename;
        	script["xlink:actuate"] = "onload";
        }

       //console.log(dest);
       //console.log(script);
       //console.log(dest);

       dest.appendChild(script);
    }
}


widgetutils.init = function () {

	widgetutils.paramArray = widgetutils.parseparams();
	widgetutils.datahub = widgetutils.getdatahub();

}


widgetutils.scripts = document.getElementsByTagName("script");
widgetutils.path = widgetutils.scripts[widgetutils.scripts.length-1].src.replace("/widgetutils.js","");
console.log(widgetutils.path);





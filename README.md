# Animera.js
This is a javascript framework for visualising realtime data from MQTT via an socket.io bridge.

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

Usage:

      <!DOCTYPE html>
      <html>
      <head>

      <script src="socket.io-1.0.0.js"></script>
      <script src="visa.js"></script>

      </head>
      <body>

      <div mqtt='bind_topic_to_html("test/topic1",null," This could be the unit")'>This value will be replaced with data sent to test/topic1 on the mqtt broaker at op-en.se</div>


      <script>

      //Create an connection to the appserver. To create your own enviroment install the playground on you own server and change the url accordingly.
      appserver = new AppClient("http://op-en.se:5000");

      //Bind all elements with an mqtt property to an mqtt topic.
      appserver.autobind();

      </script>

      </body>

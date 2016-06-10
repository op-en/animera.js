
The DeadReckoning widget shows how to use the dead reckoning function in animera.js

The parameters for the dead reckoning function are:

// The pareameters are:
// element, topic, timeProperty, valueProperty, rateProperty, updateFq, updateDelta, timeout, goback,decimals

// element - The HTML element to inject the value into.
// topic - The topic to listen to.
// timeProperty - The name of the timestamp property in the message posted on the topic. Defaults to "time".
// valueProperty - The name of the value property in the message. In case of electricity often "energy". Defaults to "value".
// rateProperty - The name of the rate proterty i.e. the power in the case of electricity. Defaults to "rate".
// updateFq - The lowest update frequency for the value. Defaults to null meining that it wont be used.
// updateDelta - A treshhold value for the calculated value which causes an update. Defaults to 1 mening that a value will be updated once it changes more than 1. But at most 30 times per second.
// timeout - The time that the dead reckoning will continue without new updates. Defaults to 60 seconds.
// goback - A flag that determines the behvour if the DR overshoots. True means that the value decreses False that is stops and wait. Defaults to false.
// decimals - The number of decimals for the value injected into the HTML element. Defaults to 0.

The example is:
```javascript
appserver.bind_topic_to_html_with_dead_reckoning(document.getElementById("value2"),topic,"time","energy","power",null,1,10,true)
```


To generate data to test it you can use these nodered nodes

```json

[{"id":"a7874357.5878c","type":"mqtt-broker","z":"","broker":"mqtt","port":"1883","clientid":"","usetls":false,"verifyservercert":true,"compatmode":true,"keepalive":"15","cleansession":true,"willTopic":"","willQos":"0","willRetain":null,"willPayload":"","birthTopic":"","birthQos":"0","birthRetain":null,"birthPayload":""},{"id":"17c5abfb.0413b4","type":"inject","z":"de0e03ad.21f2","name":"","topic":"","payload":"1","payloadType":"num","repeat":"","crontab":"","once":false,"x":119.5,"y":184,"wires":[["a9da34ca.74dcc8"]]},{"id":"39733ab9.23f086","type":"mqtt out","z":"de0e03ad.21f2","name":"","topic":"test/dr","qos":"","retain":"","broker":"a7874357.5878c","x":492.5,"y":121,"wires":[]},{"id":"a9da34ca.74dcc8","type":"function","z":"de0e03ad.21f2","name":"","func":"// initialise the counter to 0 if it doesn't exist already\nvar energy = context.get('energy')||3452;\nvar timestamp = context.get('timestamp')||(new Date).getTime()/1000;\n\nvar power = msg.payload;\n\nvar now= (new Date).getTime()/1000;\n\nvar energy = energy + (power * (now-timestamp))\n\ncontext.set('energy',energy);\ncontext.set('timestamp',now);\n\nmsg.payload = {\"power\":power,\"energy\":energy,\"time\":now}\n\nreturn msg;","outputs":1,"noerr":0,"x":290.5,"y":145,"wires":[["39733ab9.23f086","123f90bb.35306f"]]},{"id":"123f90bb.35306f","type":"debug","z":"de0e03ad.21f2","name":"","active":true,"console":"false","complete":"false","x":502.5,"y":191,"wires":[]},{"id":"634234b0.eb425c","type":"inject","z":"de0e03ad.21f2","name":"","topic":"","payload":"2","payloadType":"num","repeat":"","crontab":"","once":false,"x":128,"y":274,"wires":[["a9da34ca.74dcc8"]]},{"id":"852f71a0.2ded8","type":"inject","z":"de0e03ad.21f2","name":"","topic":"","payload":"10","payloadType":"num","repeat":"","crontab":"","once":false,"x":138,"y":358,"wires":[["a9da34ca.74dcc8"]]},{"id":"ea1e4d92.338a1","type":"inject","z":"de0e03ad.21f2","name":"","topic":"","payload":"0.5","payloadType":"num","repeat":"","crontab":"","once":false,"x":120,"y":127,"wires":[["a9da34ca.74dcc8"]]}]

```

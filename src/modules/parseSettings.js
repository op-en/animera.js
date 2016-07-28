module.exports = function (defaults) {
  // First we use the defaults from the specific widget
  var settings = defaults || {}

  // If these were not set, use global default setting
  settings.server = settings.server || 'http://op-en.se:5000'
  settings.topic = settings.topic || 'test/topic1'
  settings.max = settings.max || 10000

  // We proceed to parsing the settings in the href of the object tag
  var href = document.defaultView.location.href

  // Get the url of myself and parse it for parameters.
  if (href.indexOf('?') !== -1) {
    var paramList = href.split('?')[1].split(/&|;/)
    for (var p = 0, pLen = paramList.length; pLen > p; p++) {
      var eachParam = paramList[ p ]
      var valList = eachParam.split('=')
      var name = unescape(valList[0])
      var value = unescape(valList[1])

      settings[name] = value.replace('"', '').replace('"', '')
    }
  }

  return settings
}

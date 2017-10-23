module.exports = function (href, defaults) {
  // First we use the defaults from the specific widget
  var settings = defaults || {}

  // Get the url of myself and parse it for parameters.
  if (href.indexOf('?') !== -1) {
    var paramList = href.split('?')[1].split(/&|;/)
    for (let param of paramList) {
      const values = param.split('=')
      const name = unescape(values[0])
      let value = unescape(values[1])

      // Set up a bunch of special parsing to make it easier to pass arguments to the methods
      try {
        if (!isNaN(parseInt(value.substr(0, 1), 10))) {
          // If first character is a number, assume that we should parse to float
          value = parseFloat(value)
        } else if (value.substr(0, 1) === '[' || value.substr(0, 1) === '{') {
          // If first characted is a square bracket, assume a x value array
          // remove the brackets, split by comma and parse floats

          value = JSON.parse(value)
        
          // value = value.substr(value.indexOf('[') + 1, value.indexOf(']') - 1)
          // const arrayValues = value.split(',')
          // value = []
          //
          // for (let arrayValue of arrayValues) {
          //     var number = parseFloat(arrayValue)
          //
          //     if (!isNaN(number))
          //       value.push(number)
          //     else
          //       value.push(arrayValue)
          // }
        } else if (value === 'true' || value === 'false') {
          // parse boolean strings to true booleans
          value = (value === 'true')
        } else if (value.substr(0, 1) == '\"' && value.substr(value.length - 1) == '\"') {
          value = value.substr(1,value.length - 2)
        }

      } catch (e) {
        console.warn('Failed to parse setting, skipping ' + name)
        console.error(e)
        continue
      }

      settings[name] = value
    }
  }

  return settings
}

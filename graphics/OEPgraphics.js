/* global $ */
//
//  Open Energy Playground
//  Graphical elements
//  Copyright Marius Johansen
//  majo@flamingoz.org
// Test test

// This is the dir that will be indexed for graphical elements
var myDir = 'home'

function selectElements () {
  // Get filelist of a dir with dirList.php.
  // 'myDir' GET/POST decides which folder to index
  $.getJSON('http://op-en.se/graphics/dirList.php?myDir=' + myDir).success(function (data) {
    $('#mainDiv').html('')

    // Do something with each element in json file
    $.each(data.element, function (index) {
      var elemName = data.element[index]
      elemName = elemName.slice(0, -4)
      console.log(elemName)

      // <a href="/images/myw3schoolsimage.jpg" download>

      $('#mainDiv').append(
        '<div class="elemWrapper"> ' +
        ' <img src="' + myDir + '/' + data.element[index] + '" ><br> ' +
        elemName + '<br>' +
        '<div class="elemFormatBtn">' +
        '<a href="' + myDir + '/' + elemName + '.png" download >' +
        '<img src="graphics_png.png">' +
        '</div>' +
        '<div class="elemFormatBtn">' +
        '<a href="' + myDir + '/svg/' + elemName + '.svg" download >' +
        '<img src="graphics_svg.png">' +
        '</div>' +
        '<div class="elemFormatBtn">' +
        '<a href="' + myDir + '/eps/' + elemName + '.eps" download >' +
        '<img src="graphics_eps.png">' +
        '</div>' +
        '</div> '
      )
    }) // End of doing something for each element
  }) // End of the loading of Json
}

selectElements()

$(document).ready(function () {
  // homeBtn
  // officeBtn
  // constructionBtn
  // transportBtn
  // activitiesBtn
  // energytypeBtn
  // weatherBtn

  // Bind buttons which swicthes catergories of graphical elements
  $('#homeBtn').bind('click', function () {
    myDir = 'home'
    selectElements()
  })

  $('#officeBtn').bind('click', function () {
    myDir = 'office'
    selectElements()
  })

  $('#constructionBtn').bind('click', function () {
    myDir = 'construction'
    selectElements()
  })

  $('#transportBtn').bind('click', function () {
    myDir = 'transport'
    selectElements()
  })

  $('#activitiesBtn').bind('click', function () {
    myDir = 'activities'
    selectElements()
  })

  $('#energytypeBtn').bind('click', function () {
    myDir = 'energytype'
    selectElements()
  })

  $('#weatherBtn').bind('click', function () {
    myDir = 'weather'
    selectElements()
  })
})

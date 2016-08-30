# Animera.js
This is a javascript framework for visualising realtime data from MQTT via a socket.io bridge.

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

## Usage

TL;DR; see examples folder!

Animera.js standardizes how graphical elements on your website connect to a datasource and animate in response to real time data. We call any element that responds to real time data (where it be a part of the element or the whole) an `animation`.

Animera.js makes it easy to create any number of animations on your website and have them display in a reliable and performant way.

We also use the concept of a `widget`, which is an html (sub)document that can be embedded on your page. A widget typically contains multiple animations, but is treated as one entity/element in your main html document.

### Autobind animations

For details, see `examples/autobind.html`.

If we have an animation in the form of a svg document, we can embed it in our main html document, and use the autobind feature.

This makes Animera.js search the entire DOM-tree for elements that have the non-standard attribute `animera`. For example, if we look in the fan.svg animation, we see the following:

```html
<g id="fan" style="transform-origin: center;" animera="bindTopicToRotation?inputRange=[0,10]&amp;outputRange=[0,1]&amp;clamp=true">
```

When animera.js finds this attribute during the document search, it will see that the animation requests the method `bindTopicToRotation`. with a number of default arguments:

```
inputRange: [0, 10]
outputRange: [0, 1]
clamp: true
```

Input range is the expected range of the input data, outputRange is the result after linear transformation, and clamp defines if the animation should have a "ceiling" where it can't go any faster.

If we want to embed this in a document, we can do so with the object tag, like this:

```html
<object style="width:300px;height:350px;" data="../animations/hairdryer.svg?topic=test/topic1&amp;inputRange=[0,1]&amp;subproperty=power"></object>
```

Then we need to include the Animera.js library in the header of our html document.

```html
<script src="/assets/animera.js" data-autobind="http://op-en.se:5000"></script>
```

The `data-autobind` attribute states what server we want the animations to get their data from.

### Widgets

Embedding a widget is a simple as creating an object tag with the widget document as source:

```html
<object data="../dist/widgets/widget-sun.html?topic=test/topic1&amp;max=1"></object>
```
Settings for the animations can be set in 3 different levels:

- Inside animation
- Inside widget
- In embedding object tag.

Each level overrides the preceding one.

Each widget contains a small script that automatically downloads animera.js and runs it, so there is no need to include it in the header of the main html document.

If you have multiple widgets in the same document, only the first will download animera.js, and they will all share the same javascript object.

##### Prefetched library

If you want to improve initial performance slightly, you can include Animera.js in the header of your document.

## Development

Install development dependencies

```
npm i
```

Build using gulp. Install gulp globally for shorter commands.

```
npm i -g gulp
gulp
```

This builds all the source files and starts a webpack development server for you. You should use this server for development since it automatically rebuilds what is needed on updates, which dramatically speeds up development time.

Go to `http://localhost:8080` and select the file that you want to debug!

## Deployment

We use the github release system.

When you are ready for a new release, update the version, tag and commit by:

```
npm version [major|minor|patch]
```

Then build a production version using

```
gulp --type production
```

Be sure to follow [Semantic Versioning](http://semver.org/), namely:

Given a version number MAJOR.MINOR.PATCH, increment the:

1. MAJOR version when you make incompatible API changes,
1. MINOR version when you add functionality in a backwards-compatible manner, and
1. PATCH version when you make backwards-compatible bug fixes.

You might have to push the git tags to the server before it is visible on Github.

```
git push --tags
```

Then go to the [releases page](https://github.com/op-en/animera.js/releases) and write some release notes for the tag, and add the compiled production builds as binaries.

That way, thay are directly downloadable in the browser.

## TODO

- test framework with mocha and phantom.js
- ~~version hosting~~

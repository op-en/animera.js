# Animera.js
This is a javascript framework for visualising realtime data from MQTT via an socket.io bridge.

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

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

This builds all the source files and starts a webpack development server for you.

Go to `http://localhost:8080` to see your files being served!

## Production

Build a production version using

```
gulp --type production
```

Then copy the dist folder to somewhere temporary, checkout the gh-pages branch, and deploy the new version.

## TODO

- test framework with mocha and phantom.js
- version hosting

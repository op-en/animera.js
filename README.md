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

This builds all the source files and starts a webpack development server for you. You should use this server for development since it automatically rebuilds what is needed on updates, which dramatically speeds up development time.

Go to `http://localhost:8080` and select the file that you want to debug!

## Deployment

We use the github release system.

When you are ready for a new release, update the version, tag and commit by:

```
npm version major/minor/patch
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

Then go to the [releases page](https://github.com/op-en/animera.js/releases) and write some release notes for the tag, and add the compiled production builds as binaries.

That way, thay are directly downloadable in the browser.

## TODO

- test framework with mocha and phantom.js
- ~~version hosting~~

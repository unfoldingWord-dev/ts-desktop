translationStudio Desktop
========================

A tool to translate Bible stories into your own language  https://distantshores.org/translationStudio

## Requirements Specification
The official requirements are available at [tS Requirements](https://github.com/unfoldingWord-dev/ts-requirements).

##Software Dependencies
* [npm](http://nodejs.org/) (bundled with Node.js)
* [Bower](http://bower.io/)
* [Grunt](http://gruntjs.com/)

##Testing Frameworks
* [mocha](http://mochajs.org/) Unit testing framework
* TODO: acceptance testing framework

##Standards
* JavaScript written for this app should adhere to the [ECMAScript 6](https://github.com/lukehoban/es6features) specification or, in cases where documentation or implementation are incomplete, the [ECMAScript 5.1](http://www.ecma-international.org/ecma-262/5.1/) specification.

##Platform
The core of this project is powered by [nwjs](https://github.com/nwjs/nw.js).

##Libraries and Frameworks
tS desktop is developed using a number of different frameworks and libraries.

* [Polymer](https://www.polymer-project.org) - For building custom dom elements.
* [Lo-Dash](https://lodash.com/) - (maybe) Provides extra functional utilities.
* [Sizzle](http://sizzlejs.com/) - (maybe - Might be provided by polymer) css selector.

##Setup

Clone the repo. In the directory:

`npm install && bower install`

That's it!

##Tasks

`grunt` will produce a distribution
`grunt check` will check your JS files
`grunt sass` will compile your Sass into CSS
`npm start` will open up the project with NW.js

##Dev Inspector

When running the app, `Ctrl-Alt-I` will open the Dev Inspector.

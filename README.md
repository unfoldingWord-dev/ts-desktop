[![Crowdin](https://d322cqt584bo4o.cloudfront.net/translation-studio/localized.png)](https://crowdin.com/project/translation-studio) [![Build Status](https://travis-ci.org/unfoldingWord-dev/ts-desktop.svg?branch=develop)](https://travis-ci.org/unfoldingWord-dev/ts-desktop)

translationStudio Desktop
--

A tool to translate the Bible and [Open Bible Stories](http://distantshores.org/openbiblestories) into your own language. You can read more about the purpose of this project at [unfoldingWord](https://unfoldingword.org/apps/#tS).

##Requirements
The official development requirements are available at
* [tS Requirements](https://github.com/unfoldingWord-dev/ts-requirements)

Additional documentation specific to the desktop platforms is available in the [wiki](https://github.com/unfoldingWord-dev/ts-desktop/wiki).

##Contributing
If you would like to contribute to this project please read the [Contributing](https://github.com/unfoldingWord-dev/ts-desktop/wiki/Contributing) article in the wiki.

##Quick Start
First make sure you have all the dependencies installed

* [npm](http://nodejs.org/) (bundled with Node.js)
* [Bower](http://bower.io/)
* [Gulp](http://gulpjs.com/)

Then fork this repository and clone your fork.
After the repository has been cloned to your computer run the following command in the new directory to set up your environment

    $ npm install && bower install

For more information please read the [wiki](https://github.com/unfoldingWord-dev/ts-desktop/wiki).

###Commands
The following commands are available from within the project directory:

* `$ gulp build` builds a distribution package
* `$ gulp lint` runs the linter and the JS style checker
* `$ gulp lint --fix` same as above, but attempts to fix the JS styles for you
* `$ gulp test` runs all Mocha unit tests
* `$ gulp test --grep [string]` runs the Mocha unit tests that match the string
* `$ gulp` runs the `lint` and `test` tasks
* `$ npm start` runs the application (without building it)
* `$ DEBUG_MODE=1 npm start` same as above, but has live reloading (which is a bit unstable, hence "debug mode")

> Note: You can open the Chrome Developer Tools while the app is running by pressing `Ctrl+Alt+I`

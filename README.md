[![Crowdin](https://d322cqt584bo4o.cloudfront.net/translation-studio/localized.png)](https://crowdin.com/project/translation-studio)

translationStudio Desktop
--

A tool to translate the Bible and [Open Bible Stories](http://distantshores.org/openbiblestories) into your own language. You can read more about the purpose of this project at [unfoldingWord](https://unfoldingword.org/apps/#tS).

##Requirements
The official development requirements are available at [tS Requirements](https://github.com/unfoldingWord-dev/ts-requirements).
Additional documentation specific to the desktop platforms is available in the [wiki](https://github.com/unfoldingWord-dev/ts-desktop/wiki)

##Contributing
If you would like to contribute to this project please read the [Contributing](https://github.com/unfoldingWord-dev/ts-desktop/wiki/Contributing) article in the wiki.

##Quick Start
First make sure you have all the dependencies installed
* [npm](http://nodejs.org/) (bundled with Node.js)
* [Bower](http://bower.io/)
* [Grunt](http://gruntjs.com/)

Then clone this repository and run the following command in the new directory to set up your environment

    $ npm install && bower install

###Commands
The following commands can be ran from within the project directory

* `$ grunt` will produce a distribution
* `$ grunt check` will check your JS files
* `$ grunt sass` will compile your Sass into CSS
* `$ grunt test` will run unit tests
* `$ npm start` will open up the project with NW.js

> Note: You can open the chrome developer tools while the app is running by pressing `Ctrl+Alt+I`

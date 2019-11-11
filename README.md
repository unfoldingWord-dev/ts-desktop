[![Crowdin](https://d322cqt584bo4o.cloudfront.net/translation-studio/localized.png)](https://crowdin.com/project/translation-studio)
[![Build Status](https://travis-ci.org/unfoldingWord-dev/ts-desktop.svg?branch=develop)](https://travis-ci.org/unfoldingWord-dev/ts-desktop)

translationStudio Desktop
--

A tool to translate the Bible and [Open Bible Stories](http://distantshores.org/openbiblestories) into your own language. You can read more about the purpose of this project at [unfoldingWord](https://unfoldingword.org/apps/#tS).

## Requirements
The official development requirements are available at
* [tS Requirements](https://github.com/unfoldingWord-dev/ts-requirements)

Additional documentation specific to the desktop platforms is available in the [wiki](https://github.com/unfoldingWord-dev/ts-desktop/wiki).

## Contributing
If you would like to contribute to this project please read the [Contributing](https://github.com/unfoldingWord-dev/ts-desktop/wiki/Contributing) article in the wiki.

## Quick Start
First make sure you have [NodeJS](https://nodejs.org/) installed (choose the Current, not LTS). Then, in your terminal/command line window:

	$ npm install -g bower
	$ npm install -g gulp

Then fork this repository and clone your fork.
After the repository has been cloned to your computer run the following command in the new directory to set up your environment

    $ npm install && bower install

For more information please read the [wiki](https://github.com/unfoldingWord-dev/ts-desktop/wiki).

### Commands
The following commands are available from within the project directory:

* `$ gulp build --win` builds a windows distribution (other available flags are `--osx` and `--linux`)
* `$ gulp test` runs all Mocha unit tests
* `$ gulp test --grep [string]` runs the Mocha unit tests that match the string
* `$ gulp` runs the `test` task
* `$ npm start` runs the application (without building it)
* `$ npm run pack:ta` will update the packaged tA content.
* `$ npm run pack:rcs` will update the packaged resource containers. This will take a long time.

> Note: You can open the Chrome Developer Tools while the app is running by pressing `Ctrl+Shift+I` on Windows/Linux or `Cmd-Shift-I` on macOS.

### Building tA
tA has been built using react and es6. If you need to work on this part of the code, work in `src/js/academy-es6` and then run `npm run compile-ta`.

### Included Resources
The application is bundled with resources from the following languages

ar, as, bn, ceb, el-x-koine, en, es-419, fr, gu, hbo, hi, hr, id, ilo, kn, ml, mr, ne, or, pa, pt-br, ru, sw, ta, te, th, tl, vi

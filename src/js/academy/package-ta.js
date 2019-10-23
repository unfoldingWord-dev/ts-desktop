"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pack = pack;
exports.unpack = unpack;

var _mkdirp = _interopRequireDefault(require("mkdirp"));

var _fs = _interopRequireDefault(require("fs"));

var _rimraf = _interopRequireDefault(require("rimraf"));

var _archiver = _interopRequireDefault(require("archiver"));

var _path = _interopRequireDefault(require("path"));

var _util = require("../academy/util");

var _filereader = _interopRequireDefault(require("filereader"));

var _admZip = _interopRequireDefault(require("adm-zip"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

global.FileReader = _filereader["default"];
/**
 * Bundles up the tA material for distribution.
 * @param dest
 * @returns {Promise<void>}
 */

function pack(_x) {
  return _pack.apply(this, arguments);
}
/**
 * Unpacks the tA material and installs it.
 * @param src {string} the path where the packaged tA material can be found.
 * @param dest {string} the path where the tA material will be installed.
 * @returns {Promise<void>}
 */


function _pack() {
  _pack = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(dest) {
    var catalog, i, academyDir, destZip;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _rimraf["default"].sync(dest);

            _mkdirp["default"].sync(dest); // download catalog


            _context.next = 4;
            return (0, _util.downloadtACatalog)(dest);

          case 4:
            catalog = _context.sent;

            _fs["default"].writeFileSync(_path["default"].join(dest, 'catalog.json'), JSON.stringify(catalog)); // download articles


            i = 0;

          case 7:
            if (!(i < catalog.length)) {
              _context.next = 14;
              break;
            }

            console.log("Downloading ".concat(catalog[i].language));
            _context.next = 11;
            return (0, _util.downloadtATranslation)(catalog[i], dest);

          case 11:
            i++;
            _context.next = 7;
            break;

          case 14:
            // zip everything up
            console.log('zipping everything');
            academyDir = _path["default"].join(dest, 'translationAcademy');
            destZip = "".concat(academyDir, ".zip");
            _context.next = 19;
            return new Promise(function (resolve, reject) {
              var writer = _fs["default"].createWriteStream(destZip);

              writer.on('finish', resolve);
              writer.on('error', reject);

              var zip = _archiver["default"].create('zip');

              zip.pipe(writer);
              zip.directory(academyDir, 'translationAcademy/');
              zip.finalize();
            });

          case 19:
            _rimraf["default"].sync(academyDir);

          case 20:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _pack.apply(this, arguments);
}

function unpack(_x2, _x3) {
  return _unpack.apply(this, arguments);
}

function _unpack() {
  _unpack = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2(src, dest) {
    var catalogPath, catalog, articlesZip, zip;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            catalogPath = _path["default"].join(src, 'catalog.json');
            catalog = JSON.parse(_fs["default"].readFileSync(catalogPath).toString());
            (0, _util.cacheCatalog)(catalog);
            articlesZip = _path["default"].join(src, 'translationAcademy.zip');
            zip = new _admZip["default"](articlesZip);
            zip.extractAllTo(dest, true);

          case 6:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _unpack.apply(this, arguments);
}
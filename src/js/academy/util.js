"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.downloadtACatalog = downloadtACatalog;
exports.cacheCatalog = cacheCatalog;
exports.useCatalog = useCatalog;
exports.useKeyboard = useKeyboard;
exports.useControlledProp = useControlledProp;
exports.useHistoricState = useHistoricState;
exports.saveBlob = saveBlob;
exports.downloadtATranslation = downloadtATranslation;

var _react = require("react");

var _axios = _interopRequireDefault(require("axios"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _TranslationReader = _interopRequireDefault(require("./TranslationReader"));

var _semver = _interopRequireDefault(require("semver"));

var _dateFns = require("date-fns");

var _SimpleCache = _interopRequireWildcard(require("./SimpleCache"));

var _electron = require("electron");

var _mkdirp = _interopRequireDefault(require("mkdirp"));

var _admZip = _interopRequireDefault(require("adm-zip"));

var _rimraf = _interopRequireDefault(require("rimraf"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var cache = new _SimpleCache["default"](_SimpleCache.LOCAL_STORAGE);
var TA_CACHE_KEY = 'ta-cache';
var catalogUrl = 'https://api.door43.org/v3/subjects/Translation_Academy.json';
/**
 * Returns the path to the translation content
 * @param translation
 * @param datapath {string} the directory where translationStudio data is stored.
 * @returns {*}
 */

function getTranslationPath(translation, dataPath) {
  return _path["default"].join(getTranslationBaseDir(translation, dataPath), "".concat(translation.language, "_ta"));
}
/**
 * Returns the path to the top translation directory.
 * @param translate
 * @param dataPath
 * @returns {*}
 */


function getTranslationBaseDir(translation, dataPath) {
  return _path["default"].join(dataPath, "translationAcademy/".concat(translation.language));
}
/**
 *
 * @param translation
 * @param datapath {string}
 * @returns {boolean | *}
 */


function isTranslationDownloaded(translation, datapath) {
  return _fs["default"].existsSync(getTranslationPath(translation, datapath));
}
/**
 *
 * @param translation
 * @param datapath {string}
 * @returns {boolean}
 */


function isTranslationOutdated(translation, datapath) {
  if (!translation.downloaded) {
    return false;
  }

  try {
    var reader = new _TranslationReader["default"](getTranslationPath(translation, datapath));
    var manifest = reader.readManifest(); // check version

    var localVersion = _semver["default"].coerce(manifest.dublin_core.version);

    var remoteVersion = _semver["default"].coerce(translation.version);

    if (_semver["default"].gt(remoteVersion, localVersion)) {
      return true;
    } // check modified


    var localModified = manifest.dublin_core.modified;
    var remoteModified = translation.modified;
    return (0, _dateFns.compareAsc)(new Date(remoteModified), new Date(localModified)) > 0;
  } catch (error) {
    console.error('Invalid translation', translation, error);
    return true;
  }
}
/**
 * Downloads the tA catalog and returns the formatted entries.
 * @param datapath {string} the directory where translationStudio data is stored.
 * @returns {Promise<AxiosResponse<any>>}
 */


function downloadtACatalog(_x) {
  return _downloadtACatalog.apply(this, arguments);
}

function _downloadtACatalog() {
  _downloadtACatalog = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2(datapath) {
    var response, resources;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return _axios["default"].get(catalogUrl);

          case 2:
            response = _context2.sent;
            resources = response.data.map(function (d) {
              // filter down to the first valid resource container
              try {
                var format = d.resources[0].formats.filter(function (f) {
                  return f.format.includes('application/zip;') && f.format.includes('type=man') && f.format.includes('conformsto=rc0.2');
                })[0];
                var translation = {
                  title: d.title,
                  direction: d.direction,
                  language: d.language,
                  url: format.url,
                  size: format.size,
                  // TRICKY: there seems to be a bug in the api because it does not have the correct modified date in the format.
                  //  I think the api is using the real modified date from the commit, while the modified date in the manifest is manually updated and can become stale.
                  modified: d.resources[0].modified,
                  // format.modified,
                  version: d.resources[0].version,
                  downloaded: isTranslationDownloaded(d, datapath)
                };
                return _objectSpread({}, translation, {
                  update: isTranslationOutdated(translation, datapath)
                });
              } catch (error) {
                console.error('The resource is invalid', error, d);
                return {};
              }
            }).filter(function (r) {
              return !!r.url;
            });
            return _context2.abrupt("return", resources);

          case 5:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _downloadtACatalog.apply(this, arguments);
}

function cacheCatalog(catalog) {
  if (catalog && catalog.length) {
    cache.set(TA_CACHE_KEY, JSON.stringify(catalog));
  }
}
/**
 * Adds support for reading and downloading the translationAcademy catalog.
 * @param dataPath {string} the directory where translationStudio data is stored.
 * @returns {{updateCatalog: *, catalog: *, loading: *}}
 */


function useCatalog(dataPath) {
  var _useState = (0, _react.useState)(true),
      _useState2 = _slicedToArray(_useState, 2),
      loading = _useState2[0],
      setLoading = _useState2[1];

  var _useState3 = (0, _react.useState)([]),
      _useState4 = _slicedToArray(_useState3, 2),
      catalog = _useState4[0],
      setCatalog = _useState4[1];

  var _useState5 = (0, _react.useState)(false),
      _useState6 = _slicedToArray(_useState5, 2),
      ready = _useState6[0],
      setReady = _useState6[1];
  /**
   * Synchronizes the catalog with the filesystem
   */


  function syncCatalog() {
    _syncCatalog(catalog);
  }
  /**
   * Private sync method
   * @param c - the catalog to sync
   * @private
   */


  function _syncCatalog(c) {
    if (dataPath) {
      var newCatalog = c.map(function (r) {
        var record = _objectSpread({}, r);

        record.downloaded = isTranslationDownloaded(record, dataPath); // TRICKY: check if outdated after checking if downloaded.

        record.update = isTranslationOutdated(record, dataPath);
        return record;
      });
      setCatalog(newCatalog);
    }
  }
  /**
   * Utility to download the latest catalog
   * @returns {Promise<void>}
   */


  function updateCatalog() {
    return _updateCatalog.apply(this, arguments);
  } // load cached catalog


  function _updateCatalog() {
    _updateCatalog = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee() {
      var resources;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              setLoading(true);
              _context.prev = 1;
              _context.next = 4;
              return downloadtACatalog(dataPath);

            case 4:
              resources = _context.sent;
              setCatalog(resources);

            case 6:
              _context.prev = 6;
              setLoading(false);
              return _context.finish(6);

            case 9:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[1,, 6, 9]]);
    }));
    return _updateCatalog.apply(this, arguments);
  }

  (0, _react.useEffect)(function () {
    function getCachedCatalog() {
      var cachedCatalog = cache.get(TA_CACHE_KEY);

      if (cachedCatalog) {
        try {
          return JSON.parse(cachedCatalog);
        } catch (error) {
          console.error('Cached tA catalog was corrupt', error);
        }
      }

      return [];
    } // TRICKY: we need the dataPath to check if things are downloaded


    if (dataPath) {
      setLoading(true);

      var _catalog = getCachedCatalog();

      _syncCatalog(_catalog);

      if (!ready) {
        // the catalog is ready to go
        setReady(true);
      }

      setLoading(false);
    }
  }, [dataPath]); // keep catalog cached

  (0, _react.useEffect)(function () {
    cacheCatalog(catalog);
  }, [catalog]);
  return {
    loading: loading,
    catalog: catalog,
    ready: ready,
    updateCatalog: updateCatalog,
    syncCatalog: syncCatalog
  };
}
/**
 * Subscribes to keyboard events
 * @returns {KeyboardEvent}
 */


function useKeyboard() {
  var _useState7 = (0, _react.useState)({}),
      _useState8 = _slicedToArray(_useState7, 2),
      keys = _useState8[0],
      setKeys = _useState8[1];

  (0, _react.useEffect)(function () {
    function handleKeyDown(event) {
      setKeys(event);
    }

    function handleBlur() {
      // TRICKY: clear keys when window does not have focus
      setKeys({});
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyDown);

    _electron.ipcRenderer.on('blur', handleBlur);

    return function () {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyDown);

      _electron.ipcRenderer.removeListener('blur', handleBlur);
    };
  }, []);
  return keys;
}
/**
 * Allows the prop to override the state when changed
 * @param propValue
 * @returns {[unknown, (value: unknown) => void]}
 */


function useControlledProp(propValue) {
  var _useState9 = (0, _react.useState)(propValue),
      _useState10 = _slicedToArray(_useState9, 2),
      value = _useState10[0],
      setValue = _useState10[1];

  (0, _react.useEffect)(function () {
    setValue(propValue);
  }, propValue);
  return [value, setValue];
}
/**
 * Keeps a record of the previous non-null value.
 * @param [initialValue]
 * @returns {[value, history, setValue]}
 */


function useHistoricState() {
  var initialValue = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

  var _useState11 = (0, _react.useState)(initialValue),
      _useState12 = _slicedToArray(_useState11, 2),
      value = _useState12[0],
      setValue = _useState12[1];

  var _useState13 = (0, _react.useState)(),
      _useState14 = _slicedToArray(_useState13, 2),
      history = _useState14[0],
      setHistory = _useState14[1];

  (0, _react.useEffect)(function () {
    if (value !== null && value !== undefined) {
      setHistory(value);
    }
  }, [value]);
  return [value, history, setValue];
}

function saveBlob(blob, dest) {
  return new Promise(function (resolve, reject) {
    var fileReader = new FileReader();

    fileReader.onload = function () {
      try {
        var buffer = Buffer.from(new Uint8Array(this.result));

        _fs["default"].writeFileSync(dest, buffer);

        resolve();
      } catch (error) {
        reject(error);
      }
    };

    fileReader.onerror = function (event) {
      fileReader.abort();
      reject(event);
    };

    fileReader.readAsArrayBuffer(blob);
  });
}
/**
 * Creates a response writer that will handle the type of data correctly.
 * @param dest
 * @param type
 * @returns {(function(*): (*|Promise<unknown>|Promise))|(function(*): Promise<unknown>)}
 */


function makeResponseWriter(dest, type) {
  if (type === 'blob') {
    return function (response) {
      return saveBlob(response.data, dest);
    };
  } else {
    // stream
    return function (response) {
      var writer = _fs["default"].createWriteStream(dest);

      response.data.pipe(writer);
      return new Promise(function (resolve, reject) {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    };
  }
}
/**
 * Downloads a tA translation to the destination and caches the images.
 * @param translation
 * @param dest
 * @param [onProgress]
 * @returns {Promise<void>}
 */


function downloadtATranslation(_x2, _x3) {
  return _downloadtATranslation.apply(this, arguments);
}

function _downloadtATranslation() {
  _downloadtATranslation = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee3(translation, dest) {
    var onProgress,
        translationDest,
        zipDest,
        responseType,
        response,
        zip,
        reader,
        imageLinks,
        i,
        len,
        link,
        _response,
        cacheDir,
        imageDest,
        _args3 = arguments;

    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            onProgress = _args3.length > 2 && _args3[2] !== undefined ? _args3[2] : null;
            translationDest = getTranslationBaseDir(translation, dest);
            zipDest = "".concat(translationDest, ".zip");

            _mkdirp["default"].sync(translationDest);

            responseType = 'stream'; // 'blob';
            // download zip

            _context3.next = 7;
            return _axios["default"].get(translation.url, {
              responseType: responseType,
              onDownloadProgress: function onDownloadProgress(progressEvent) {
                if (progressEvent.lengthComputable && typeof onProgress === 'function') {
                  var progress = progressEvent.loaded / progressEvent.total;
                  onProgress(translation, progress);
                }
              }
            });

          case 7:
            response = _context3.sent;
            _context3.next = 10;
            return makeResponseWriter(zipDest, responseType)(response);

          case 10:
            // extract zip
            zip = new _admZip["default"](zipDest);
            zip.extractAllTo(translationDest, true);

            _rimraf["default"].sync(zipDest); // find images


            reader = new _TranslationReader["default"](getTranslationPath(translation, dest));
            imageLinks = [];
            reader.listArticles(function (article) {
              var result = article.body.match(/!\[]\(([^)]+)\)/g);

              if (result) {
                var links = result.map(function (img) {
                  return {
                    articlePath: article.path,
                    href: img.match(/!\[]\(([^)]+)\)/)[1]
                  };
                });
                imageLinks.push.apply(imageLinks, links);
              }
            }); // download images

            i = 0, len = imageLinks.length;

          case 17:
            if (!(i < len)) {
              _context3.next = 30;
              break;
            }

            link = imageLinks[i];
            _context3.next = 21;
            return _axios["default"].get(link.href, {
              responseType: responseType
            });

          case 21:
            _response = _context3.sent;
            cacheDir = _path["default"].join(link.articlePath, '.cache');

            _mkdirp["default"].sync(cacheDir);

            imageDest = _path["default"].join(cacheDir, "".concat(_path["default"].basename(link.href)));
            _context3.next = 27;
            return makeResponseWriter(imageDest, responseType)(_response);

          case 27:
            i++;
            _context3.next = 17;
            break;

          case 30:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _downloadtATranslation.apply(this, arguments);
}
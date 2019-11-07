"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = Academy;

var _react = _interopRequireWildcard(require("react"));

var _ChooseTranslationDialog = _interopRequireDefault(require("./ChooseTranslationDialog"));

var _Articles = _interopRequireDefault(require("./Articles"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _axios = _interopRequireDefault(require("axios"));

var _ConfirmDownloadDialog = _interopRequireDefault(require("./ConfirmDownloadDialog"));

var _path = _interopRequireDefault(require("path"));

var _admZip = _interopRequireDefault(require("adm-zip"));

var _mkdirp = _interopRequireDefault(require("mkdirp"));

var _rimraf = _interopRequireDefault(require("rimraf"));

var _ConfirmRemoteLinkDialog = _interopRequireDefault(require("./ConfirmRemoteLinkDialog"));

var _TranslationReader = _interopRequireDefault(require("../TranslationReader"));

var _LoadingDialog = _interopRequireDefault(require("./LoadingDialog"));

var _ErrorDialog = _interopRequireDefault(require("./ErrorDialog"));

var _util = require("../util");

var _electron = require("electron");

var _hooks = require("../hooks");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

/**
 * Renders the tA page
 * @returns
 * @constructor
 */
function Academy(props) {
  var onClose = props.onClose,
      onOpenLink = props.onOpenLink;

  var _useState = (0, _react.useState)(),
      _useState2 = _slicedToArray(_useState, 2),
      dataPath = _useState2[0],
      setDataPath = _useState2[1];

  var _useHistoricState = (0, _util.useHistoricState)(),
      _useHistoricState2 = _slicedToArray(_useHistoricState, 3),
      lang = _useHistoricState2[0],
      previousLang = _useHistoricState2[1],
      setLang = _useHistoricState2[2];

  var _useState3 = (0, _react.useState)(),
      _useState4 = _slicedToArray(_useState3, 2),
      articleId = _useState4[0],
      setArticleId = _useState4[1];

  var _useCatalog = (0, _util.useCatalog)(dataPath),
      loadingCatalog = _useCatalog.loading,
      catalog = _useCatalog.catalog,
      updateCatalog = _useCatalog.updateCatalog,
      syncCatalog = _useCatalog.syncCatalog,
      catalogIsReady = _useCatalog.ready;

  var _useState5 = (0, _react.useState)([]),
      _useState6 = _slicedToArray(_useState5, 2),
      articles = _useState6[0],
      setArticles = _useState6[1];

  var _useState7 = (0, _react.useState)(null),
      _useState8 = _slicedToArray(_useState7, 2),
      translation = _useState8[0],
      setTranslation = _useState8[1];

  var _useState9 = (0, _react.useState)(false),
      _useState10 = _slicedToArray(_useState9, 2),
      confirmDownload = _useState10[0],
      setConfirmDownload = _useState10[1];

  var _useState11 = (0, _react.useState)(false),
      _useState12 = _slicedToArray(_useState11, 2),
      confirmLink = _useState12[0],
      setConfirmLink = _useState12[1];

  var _useState13 = (0, _react.useState)(null),
      _useState14 = _slicedToArray(_useState13, 2),
      clickedLink = _useState14[0],
      setClickedLink = _useState14[1];

  var _useState15 = (0, _react.useState)(null),
      _useState16 = _slicedToArray(_useState15, 2),
      errorMessage = _useState16[0],
      setError = _useState16[1];

  var _useState17 = (0, _react.useState)({}),
      _useState18 = _slicedToArray(_useState17, 2),
      loading = _useState18[0],
      setLoading = _useState18[1];

  var loadingTitle = loading.loadingTitle,
      loadingMessage = loading.loadingMessage,
      loadingProgress = loading.progress;
  (0, _hooks.useStableResize)(document.getElementById('articles'));

  function handleCancelDownload() {
    setConfirmDownload(false); // close translation if not already downloaded

    if (!translation.downloaded) {
      setLang(null);
    }
  }

  function getTranslationPath(translation) {
    return _path["default"].join(dataPath, "translationAcademy/".concat(translation.language, "/").concat(translation.language, "_ta"));
  }
  /**
   * Utility to set the proper loading status for the translation download.
   * @param translation
   * @param progress
   */


  function setDownloadingTranslation(translation, progress) {
    var update = translation.update,
        title = translation.title,
        language = translation.language;
    var loadingTitle = 'Downloading';

    if (update) {
      loadingTitle = 'Updating';
    }

    setLoading({
      loadingTitle: loadingTitle,
      loadingMessage: "".concat(loadingTitle, " translationAcademy ").concat(title, " (").concat(language, "). Please wait."),
      progress: progress
    });
  }

  function handleConfirmDownload() {
    return _handleConfirmDownload.apply(this, arguments);
  }

  function _handleConfirmDownload() {
    _handleConfirmDownload = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee2() {
      var extractDest, dest;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              setConfirmDownload(false);
              setDownloadingTranslation(translation, 0);
              extractDest = _path["default"].join(dataPath, "translationAcademy/".concat(translation.language));
              dest = "".concat(extractDest, ".zip");

              _mkdirp["default"].sync(extractDest);

              _axios["default"].get(translation.url, {
                responseType: 'blob',
                onDownloadProgress: function onDownloadProgress(progressEvent) {
                  if (progressEvent.lengthComputable) {
                    var progress = progressEvent.loaded / progressEvent.total;
                    setDownloadingTranslation(translation, progress);
                  }
                }
              }).then(function (response) {
                // write data to file
                return (0, _util.saveBlob)(response.data, dest).then(function () {
                  try {
                    var zip = new _admZip["default"](dest);
                    zip.extractAllTo(extractDest, true);

                    _rimraf["default"].sync(dest);

                    return Promise.resolve();
                  } catch (error) {
                    return Promise.reject(error);
                  }
                });
              }).then(function () {
                // find images
                var reader = new _TranslationReader["default"](getTranslationPath(translation));
                var imageLinks = [];

                try {
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
                  });
                } catch (error) {
                  return Promise.reject(error);
                }

                return Promise.resolve(imageLinks);
              }).then(
              /*#__PURE__*/
              function () {
                var _ref = _asyncToGenerator(
                /*#__PURE__*/
                regeneratorRuntime.mark(function _callee(links) {
                  var i, len, link, response, cacheDir, imageDest;
                  return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          i = 0, len = links.length;

                        case 1:
                          if (!(i < len)) {
                            _context.next = 15;
                            break;
                          }

                          link = links[i];
                          _context.next = 5;
                          return _axios["default"].get(link.href, {
                            responseType: 'blob'
                          });

                        case 5:
                          response = _context.sent;
                          cacheDir = _path["default"].join(link.articlePath, '.cache');
                          _context.next = 9;
                          return (0, _mkdirp["default"])(cacheDir);

                        case 9:
                          imageDest = _path["default"].join(cacheDir, "".concat(_path["default"].basename(link.href)));
                          _context.next = 12;
                          return (0, _util.saveBlob)(response.data, imageDest);

                        case 12:
                          i++;
                          _context.next = 1;
                          break;

                        case 15:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee);
                }));

                return function (_x) {
                  return _ref.apply(this, arguments);
                };
              }()).then(function () {
                // update translation
                var updatedTranslation = _objectSpread({}, translation, {
                  downloaded: true,
                  update: false
                }); // update list of what's been downloaded


                syncCatalog(); // TRICKY: for now the translation object is not updated when the catalog is updated,
                //  so we manually update it now.

                setTranslation(updatedTranslation); // TRICKY: set loading to finished

                setDownloadingTranslation(translation, 1); // TRICKY: wait a moment to ensure minimum loading time

                setTimeout(function () {
                  setLoading({});
                }, 1000);
              })["catch"](function (error) {
                setError({
                  message: "Unable to download translationAcademy ".concat(translation.title, " (").concat(translation.language, "). Check for updates and try again."),
                  error: error
                });
                setLoading({});
                setConfirmDownload(false);

                _rimraf["default"].sync(dest);

                _rimraf["default"].sync(extractDest);

                setLang(null);
                console.error("Could not download ".concat(translation.url), error);
              });

            case 6:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));
    return _handleConfirmDownload.apply(this, arguments);
  }

  function handleDeleteTranslation(selectedTranslation) {
    try {
      var dir = getTranslationPath(selectedTranslation);

      _rimraf["default"].sync(dir);

      syncCatalog();
    } catch (error) {
      setError({
        message: "Failed to delete translationAcademy ".concat(selectedTranslation.title, " (").concat(selectedTranslation.language, ")."),
        error: error
      });
    }
  }

  function handleSelectTranslation(newTranslation) {
    if (newTranslation === null) {
      onClose();
    } else {
      setLang(newTranslation.language);
    }
  }

  function handleCheckForUpdate() {
    return _handleCheckForUpdate.apply(this, arguments);
  } // listen to events from main thread


  function _handleCheckForUpdate() {
    _handleCheckForUpdate = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee3() {
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              setLoading({
                loadingTitle: 'Updating',
                loadingMessage: 'Looking for updates to translationAcademy. Please wait.',
                progress: 0
              });
              _context3.prev = 1;
              _context3.next = 4;
              return updateCatalog();

            case 4:
              _context3.next = 10;
              break;

            case 6:
              _context3.prev = 6;
              _context3.t0 = _context3["catch"](1);
              setError({
                message: 'Unable to check for updates. Please try again.',
                error: _context3.t0
              });
              console.error(_context3.t0);

            case 10:
              _context3.prev = 10;
              setLoading({});
              return _context3.finish(10);

            case 13:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, null, [[1, 6, 10, 13]]);
    }));
    return _handleCheckForUpdate.apply(this, arguments);
  }

  (0, _react.useEffect)(function () {
    function handlePropsChange(event, props) {
      // TODO: reload stuff
      setDataPath(props.dataPath);
      setLang(props.lang);
      setArticleId(props.articleId);
    }

    _electron.ipcRenderer.on('props', handlePropsChange);

    return function () {
      _electron.ipcRenderer.removeListener('props', handlePropsChange);
    };
  }, []); // listen to keyboard

  (0, _react.useEffect)(function () {
    function handleKeyDown(event) {
      if (event.ctrlKey && event.key === 'o') {
        setLang(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return function () {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // update translation when the props change

  (0, _react.useEffect)(function () {
    // TRICKY: scroll to the top so that new translations don't open in the middle.
    handleScroll('scroll-top');

    if (!catalogIsReady) {
      return;
    }

    var filtered = catalog.filter(function (t) {
      return t.language === lang;
    });

    if (filtered.length > 0) {
      setTranslation(filtered[0]);
    } else {
      setTranslation(null);
    }
  }, [lang, catalogIsReady]); // scroll to article

  (0, _react.useEffect)(function () {
    if (articles.length) {
      handleScroll(articleId); // clear this prop so subsequent link clicks trigger an update

      if (articleId !== null) {
        setArticleId(null);
      }
    }
  }, [articleId, articles]); // monitor translation validity and load articles

  (0, _react.useEffect)(function () {
    // no translation
    if (!translation || !translation.downloaded) {
      setArticles([]);
    } // download available


    if (translation && (!translation.downloaded || translation.update)) {
      setConfirmDownload(true);
    } else {
      setConfirmDownload(false);
    } // content available


    if (translation && translation.downloaded) {
      var reader = new _TranslationReader["default"](getTranslationPath(translation));

      try {
        setArticles(reader.listArticles());
      } catch (error) {
        console.error('The translation is corrupt', error);
        var dir = getTranslationPath(translation);

        _rimraf["default"].sync(dir);

        setError({
          message: "translationAcademy ".concat(translation.title, " (").concat(translation.language, ") is corrupt. Please check for updates and download again."),
          error: error
        });
        setLang(null);
      }
    }
  }, [translation]);

  function handleClickLink(link) {
    if (link.articleId) {
      handleScroll(link.articleId);
    } else if (link.href) {
      setClickedLink(link.href);
      setConfirmLink(true);
    }
  }

  function handleScroll(id) {
    var element = document.getElementById(id);

    if (element) {
      element.scrollIntoView();
    }
  }

  function handleConfirmLink() {
    onOpenLink(clickedLink);
    setConfirmLink(false);
  }

  function handleCancelLink() {
    setConfirmLink(false);
  }

  function handleDismissError() {
    setError(null);
  }

  var isChooseDialogOpen = !translation && !loadingCatalog && !errorMessage;
  return _react["default"].createElement(_react["default"].Fragment, null, _react["default"].createElement(_Articles["default"], {
    articles: articles,
    onClickLink: handleClickLink
  }), _react["default"].createElement(_ChooseTranslationDialog["default"], {
    open: isChooseDialogOpen,
    options: catalog,
    initialValue: previousLang,
    onUpdate: handleCheckForUpdate,
    onDelete: handleDeleteTranslation,
    onClose: handleSelectTranslation
  }), _react["default"].createElement(_ConfirmDownloadDialog["default"], {
    translation: translation,
    open: confirmDownload,
    onCancel: handleCancelDownload,
    onOk: handleConfirmDownload
  }), _react["default"].createElement(_ConfirmRemoteLinkDialog["default"], {
    href: clickedLink,
    open: confirmLink,
    onCancel: handleCancelLink,
    onOk: handleConfirmLink
  }), _react["default"].createElement(_LoadingDialog["default"], {
    open: !!loadingTitle,
    title: loadingTitle,
    message: loadingMessage,
    progress: loadingProgress
  }), _react["default"].createElement(_ErrorDialog["default"], {
    title: "Error",
    error: errorMessage,
    open: errorMessage !== null,
    onClose: handleDismissError
  }));
}

Academy.propTypes = {
  onClose: _propTypes["default"].func.isRequired,
  onOpenLink: _propTypes["default"].func.isRequired
};
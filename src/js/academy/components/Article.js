"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = Article;

var _react = _interopRequireWildcard(require("react"));

var _reactContentLoader = _interopRequireWildcard(require("react-content-loader"));

var _remark = _interopRequireDefault(require("remark"));

var _remarkReact = _interopRequireDefault(require("remark-react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _core = require("@material-ui/core");

var _path = _interopRequireDefault(require("path"));

var _RCLinkContainer = _interopRequireDefault(require("./RCLinkContainer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var ImageLoader = function ImageLoader() {
  return _react["default"].createElement(_reactContentLoader["default"], {
    height: 400,
    width: 400,
    speed: 2,
    style: {
      height: 400
    },
    primaryColor: "#f3f3f3",
    secondaryColor: "#ecebeb"
  }, _react["default"].createElement("rect", {
    x: "28",
    y: "24",
    rx: "5",
    ry: "5",
    width: "344",
    height: "344"
  }));
};

var useStyles = (0, _core.makeStyles)(function (theme) {
  return {
    ltr: {
      direction: 'ltr'
    },
    rtl: {
      direction: 'rtl'
    }
  };
});
/**
 * Renders a single tA article
 * @param props
 * @returns
 * @constructor
 */

function Article(props) {
  var title = props.title,
      subTitle = props.subTitle,
      body = props.body,
      manualId = props.manualId,
      articlePath = props.path,
      articleId = props.articleId,
      direction = props.direction,
      onClickLink = props.onClickLink;

  var _useState = (0, _react.useState)(_react["default"].createElement(_reactContentLoader.List, {
    speed: 2
  })),
      _useState2 = _slicedToArray(_useState, 2),
      component = _useState2[0],
      setComponent = _useState2[1];

  var classes = useStyles();
  (0, _react.useEffect)(function () {
    function handleClickLink(link) {
      onClickLink(_objectSpread({}, link, {
        manualId: link.manualId ? link.manualId : manualId
      }));
    }

    var options = {
      remarkReactComponents: {
        a: function a(props) {
          return _react["default"].createElement(_RCLinkContainer["default"], _extends({}, props, {
            onClick: handleClickLink
          }));
        },
        div: function div(props) {
          return _react["default"].createElement("div", _extends({}, props, {
            style: {
              width: '100%'
            }
          }));
        },
        img: function img(props) {
          if (props.src) {
            return _react["default"].createElement("img", _extends({}, props, {
              src: _path["default"].join(articlePath, '.cache', _path["default"].basename(props.src))
            }));
          } else {
            console.warn('Unable to display image', props);
            return _react["default"].createElement(ImageLoader, {
              id: "broken-image"
            });
          }
        }
      }
    };
    setTimeout(function () {
      (0, _remark["default"])().use(_remarkReact["default"], options).process(body, function (error, file) {
        if (error) {
          console.error("Failed to render the article at ".concat(articlePath), error);
        } else {
          setComponent(file.contents);
        }
      });
    }, 500);
  }, [body]);
  return _react["default"].createElement("div", {
    id: articleId,
    className: direction === 'rtl' ? classes.rtl : classes.ltr
  }, _react["default"].createElement("h1", null, title), _react["default"].createElement("h2", null, subTitle), component);
}

Article.propTypes = {
  manualId: _propTypes["default"].string.isRequired,
  articleId: _propTypes["default"].string.isRequired,
  title: _propTypes["default"].string.isRequired,
  path: _propTypes["default"].string.isRequired,
  subTitle: _propTypes["default"].string,
  body: _propTypes["default"].string,
  direction: _propTypes["default"].string.isRequired,
  onClickLink: _propTypes["default"].func.isRequired
};
Article.defaultProps = {
  direction: 'ltr'
};
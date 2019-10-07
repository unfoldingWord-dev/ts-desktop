"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = RCLinkContainer;

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _Tooltip = _interopRequireDefault(require("@material-ui/core/Tooltip"));

var _core = require("@material-ui/core");

var _icons = require("@material-ui/icons");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var useStyles = (0, _core.makeStyles)(function (theme) {
  return {
    chip: {
      height: 'unset',
      maxWidth: '95%'
    },
    label: {
      maxWidth: '81%'
    }
  };
});

function RCLinkContainer(props) {
  var href = props.href,
      children = props.children,
      onClick = props.onClick;
  var classes = useStyles();
  var child = children ? children[0] : null;

  var _useState = (0, _react.useState)({
    title: href ? href : child
  }),
      _useState2 = _slicedToArray(_useState, 2),
      link = _useState2[0],
      setLink = _useState2[1];

  function handleOpen() {
    if (link.clickable) {
      onClick(link);
    }
  }

  (0, _react.useEffect)(function () {
    function parseHref(href, title) {
      var manual,
          article,
          linkTitle = title;
      var regexpDeepLinks = /\.\.\/\.\.\/([\w-_]+)\/([\w-_]+)\/(.+)/;
      var regexpLocalLinks = /\.\.\/([\w-_]+)\/(.+)/;
      var regexpHREFLinks = /https?:.*/;
      var regexpEmailLinks = /mailto:(.*)/;

      if (regexpDeepLinks.test(href)) {
        var _regexpDeepLinks$exec = regexpDeepLinks.exec(href);

        var _regexpDeepLinks$exec2 = _slicedToArray(_regexpDeepLinks$exec, 3);

        manual = _regexpDeepLinks$exec2[1];
        article = _regexpDeepLinks$exec2[2];
      } else if (regexpLocalLinks.test(href)) {
        var _regexpLocalLinks$exe = regexpLocalLinks.exec(href);

        var _regexpLocalLinks$exe2 = _slicedToArray(_regexpLocalLinks$exe, 2);

        article = _regexpLocalLinks$exe2[1];
      } else if (regexpHREFLinks.test(href)) {
        return {
          icon: 'link',
          href: href,
          title: title ? title : href,
          clickable: true
        };
      } else if (regexpEmailLinks.test(href)) {
        var _regexpEmailLinks$exe = regexpEmailLinks.exec(href),
            _regexpEmailLinks$exe2 = _slicedToArray(_regexpEmailLinks$exe, 2),
            email = _regexpEmailLinks$exe2[1];

        return {
          icon: 'email',
          href: href,
          title: title ? title : email,
          clickable: false
        };
      } else {
        // unsupported
        return null;
      }

      if (!linkTitle) {
        // TODO: load the link title from the file system.
        console.warn('Missing link title', props);
        linkTitle = href;
      }

      return {
        icon: 'subject',
        manualId: manual,
        articleId: article,
        title: linkTitle,
        clickable: true
      };
    }

    var parsedLink = parseHref(href, children ? children[0] : null);

    if (parsedLink) {
      setLink(parsedLink);
    } else {
      console.warn('unable to parse the link', props);
    }
  }, [href]);

  function getIcon(link) {
    switch (link.icon) {
      case 'email':
        return _react["default"].createElement(_icons.Email, null);

      case 'subject':
        return _react["default"].createElement(_icons.Subject, null);

      case 'link':
        return _react["default"].createElement(_icons.Link, null);

      default:
        return null;
    }
  }

  return _react["default"].createElement(_Tooltip["default"], {
    title: link.title
  }, _react["default"].createElement(_core.Chip, {
    label: _react["default"].createElement(_core.Typography, {
      noWrap: true,
      component: "span"
    }, link.title),
    component: "span",
    className: classes.chip,
    classes: {
      label: classes.label
    },
    onClick: handleOpen,
    variant: "outlined",
    icon: getIcon(link),
    color: "primary",
    clickable: link.clickable
  }));
}

RCLinkContainer.propTypes = {
  href: _propTypes["default"].string.isRequired,
  children: _propTypes["default"].array
};
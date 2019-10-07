"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ArticleList;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _reactContentLoader = require("react-content-loader");

var _styles = require("@material-ui/core/styles");

var _Article = _interopRequireDefault(require("./Article"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

var useStyles = (0, _styles.makeStyles)(function (theme) {
  return {
    root: {
      width: '100%',
      overflowY: 'scroll',
      backgroundColor: '#fff',
      // TRICKY: give room for the title bar
      maxHeight: 'calc(100vh - 40px)'
    },
    frame: {
      padding: 30
    },
    loading: {
      maxWidth: 600
    }
  };
});
/**
 * Renders a list of tA articles.
 * While the list is empty a placeholder will be displayed.
 * @param articles
 * @param onClickLink
 * @returns
 * @constructor
 */

function ArticleList(_ref) {
  var articles = _ref.articles,
      onClickLink = _ref.onClickLink;
  var classes = useStyles();

  if (articles.length > 0) {
    return _react["default"].createElement("div", {
      id: "articles",
      className: classes.root
    }, _react["default"].createElement("div", {
      className: classes.frame
    }, _react["default"].createElement("div", {
      id: "scroll-top"
    }), articles.map(function (a, i) {
      return _react["default"].createElement(_Article["default"], _extends({}, a, {
        key: i,
        onClickLink: onClickLink
      }));
    })));
  } else {
    // placeholder while articles are loading
    return _react["default"].createElement("div", {
      id: "articles",
      className: classes.root
    }, _react["default"].createElement("div", {
      className: classes.frame
    }, _react["default"].createElement("div", {
      id: "scroll-top"
    }), _react["default"].createElement("div", {
      className: classes.loading
    }, _react["default"].createElement(_reactContentLoader.List, {
      speed: 2
    }), _react["default"].createElement(_reactContentLoader.BulletList, {
      speed: 2
    }), _react["default"].createElement(_reactContentLoader.List, {
      speed: 2
    }), _react["default"].createElement(_reactContentLoader.List, {
      speed: 2
    }))));
  }
}

ArticleList.propTypes = {
  articles: _propTypes["default"].array.isRequired,
  onClickLink: _propTypes["default"].func.isRequired
};
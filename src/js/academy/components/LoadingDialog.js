"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = LoadingDialog;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _core = require("@material-ui/core");

var _DialogTitle = _interopRequireDefault(require("@material-ui/core/DialogTitle"));

var _DialogContent = _interopRequireDefault(require("@material-ui/core/DialogContent"));

var _CircularProgress = _interopRequireDefault(require("@material-ui/core/CircularProgress"));

var _styles = require("@material-ui/core/styles");

var _Grid = _interopRequireDefault(require("@material-ui/core/Grid"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

var useStyles = (0, _styles.makeStyles)(function (theme) {
  return {
    progress: {
      margin: theme.spacing(2)
    }
  };
});

function LoadingDialog(props) {
  var open = props.open,
      title = props.title,
      message = props.message,
      progress = props.progress,
      other = _objectWithoutProperties(props, ["open", "title", "message", "progress"]);

  var classes = useStyles();
  var indeterminate = progress === 0 || progress === 1;
  return _react["default"].createElement(_core.Dialog, _extends({
    disableBackdropClick: true,
    disableEscapeKeyDown: true,
    maxWidth: "sm",
    open: open
  }, other), _react["default"].createElement(_DialogTitle["default"], null, title), _react["default"].createElement(_DialogContent["default"], null, _react["default"].createElement(_Grid["default"], {
    container: true,
    spacing: 1,
    alignItems: "center"
  }, _react["default"].createElement(_Grid["default"], {
    item: true
  }, _react["default"].createElement(_CircularProgress["default"], {
    className: classes.progress,
    variant: indeterminate ? "indeterminate" : "determinate",
    value: progress * 100,
    color: "primary"
  })), _react["default"].createElement(_Grid["default"], {
    item: true
  }, _react["default"].createElement("span", null, message)))));
}

LoadingDialog.propTypes = {
  open: _propTypes["default"].bool,
  title: _propTypes["default"].string,
  message: _propTypes["default"].string,
  progress: _propTypes["default"].number
};
LoadingDialog.defaultProps = {
  progress: 0,
  title: "Loading",
  message: "Please wait"
};
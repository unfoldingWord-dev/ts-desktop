"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ConfirmationDialog;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _Dialog = _interopRequireDefault(require("@material-ui/core/Dialog"));

var _DialogTitle = _interopRequireDefault(require("@material-ui/core/DialogTitle"));

var _DialogContent = _interopRequireDefault(require("@material-ui/core/DialogContent"));

var _DialogActions = _interopRequireDefault(require("@material-ui/core/DialogActions"));

var _Button = _interopRequireDefault(require("@material-ui/core/Button"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

/**
 * Displays a simple confirmation dialog
 * @param props
 * @returns {*}
 * @constructor
 */
function ConfirmationDialog(props) {
  var open = props.open,
      title = props.title,
      message = props.message,
      onOk = props.onOk,
      onCancel = props.onCancel,
      other = _objectWithoutProperties(props, ["open", "title", "message", "onOk", "onCancel"]);

  var closeButtonRef = _react["default"].useRef(null);

  function handleEntering() {
    if (closeButtonRef.current != null) {
      closeButtonRef.current.focus();
    }
  }

  return _react["default"].createElement(_Dialog["default"], _extends({
    disableBackdropClick: true,
    disableEscapeKeyDown: true,
    maxWidth: "xs",
    onEntering: handleEntering,
    open: open
  }, other), _react["default"].createElement(_DialogTitle["default"], null, title), _react["default"].createElement(_DialogContent["default"], null, message), _react["default"].createElement(_DialogActions["default"], null, _react["default"].createElement(_Button["default"], {
    onClick: onCancel,
    color: "primary"
  }, "Cancel"), _react["default"].createElement(_Button["default"], {
    onClick: onOk,
    color: "primary"
  }, "Ok")));
}

ConfirmationDialog.propTypes = {
  open: _propTypes["default"].bool.isRequired,
  title: _propTypes["default"].string.isRequired,
  message: _propTypes["default"].string.isRequired,
  onOk: _propTypes["default"].func.isRequired,
  onCancel: _propTypes["default"].func.isRequired
};
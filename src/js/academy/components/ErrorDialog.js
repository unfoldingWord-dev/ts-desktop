"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ErrorDialog;

var _react = _interopRequireDefault(require("react"));

var _core = require("@material-ui/core");

var _DialogTitle = _interopRequireDefault(require("@material-ui/core/DialogTitle"));

var _DialogContent = _interopRequireDefault(require("@material-ui/core/DialogContent"));

var _DialogActions = _interopRequireDefault(require("@material-ui/core/DialogActions"));

var _Button = _interopRequireDefault(require("@material-ui/core/Button"));

var _propTypes = _interopRequireDefault(require("prop-types"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ErrorDialog(props) {
  var onClose = props.onClose,
      open = props.open,
      title = props.title,
      message = props.message;
  return _react["default"].createElement(_core.Dialog, {
    open: open,
    onClose: onClose,
    onEscapeKeyDown: onClose
  }, _react["default"].createElement(_DialogTitle["default"], null, title), _react["default"].createElement(_DialogContent["default"], null, message), _react["default"].createElement(_DialogActions["default"], null, _react["default"].createElement(_Button["default"], {
    onClick: onClose
  }, "Ok")));
}

ErrorDialog.propTypes = {
  title: _propTypes["default"].string,
  message: _propTypes["default"].string,
  onClose: _propTypes["default"].func.isRequired,
  open: _propTypes["default"].bool.isRequired
};
ErrorDialog.defaultProps = {
  title: '',
  message: ''
};
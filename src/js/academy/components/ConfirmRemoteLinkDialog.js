"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ConfirmRemoteLinkDialog;

var _ConfirmationDialog = _interopRequireDefault(require("./ConfirmationDialog"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _react = _interopRequireDefault(require("react"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function ConfirmRemoteLinkDialog(props) {
  var href = props.href,
      other = _objectWithoutProperties(props, ["href"]);

  var message = "You are about to visit ".concat(href, " in your internet browser. Continue?");
  return _react["default"].createElement(_ConfirmationDialog["default"], _extends({
    title: "Visit Website",
    message: message
  }, other));
}

ConfirmRemoteLinkDialog.propTypes = {
  href: _propTypes["default"].string,
  open: _propTypes["default"].bool.isRequired,
  onOk: _propTypes["default"].func.isRequired,
  onCancel: _propTypes["default"].func.isRequired
};
ConfirmRemoteLinkDialog.defaultProps = {
  href: ''
};
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ConfirmDownloadDialog;

var _ConfirmationDialog = _interopRequireDefault(require("./ConfirmationDialog"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _react = _interopRequireDefault(require("react"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function ConfirmDownloadDialog(props) {
  var translation = props.translation,
      other = _objectWithoutProperties(props, ["translation"]);

  var message = '';
  var dialogTitle = 'Download translationAcademy';

  if (translation) {
    var update = translation.update,
        title = translation.title,
        language = translation.language;
    message = "Do you want to download translationAcademy ".concat(title, " (").concat(language, ")?");

    if (update) {
      dialogTitle = 'Update translationAcademy';
      message = "An update is available for translationAcademy ".concat(title, " (").concat(language, "). Would you like to download it now?");
    }
  }

  return _react["default"].createElement(_ConfirmationDialog["default"], _extends({
    title: dialogTitle,
    message: message
  }, other));
}

ConfirmDownloadDialog.propTypes = {
  translation: _propTypes["default"].shape({
    update: _propTypes["default"].bool.isRequired,
    title: _propTypes["default"].string.isRequired,
    language: _propTypes["default"].string.isRequired
  }),
  open: _propTypes["default"].bool.isRequired,
  onOk: _propTypes["default"].func.isRequired,
  onCancel: _propTypes["default"].func.isRequired
};
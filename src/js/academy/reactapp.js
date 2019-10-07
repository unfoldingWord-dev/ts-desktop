"use strict";

var _react = _interopRequireDefault(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _electron = require("electron");

var _Academy = _interopRequireDefault(require("./components/Academy"));

var _styles = require("@material-ui/styles");

var _styles2 = require("@material-ui/core/styles");

var _lightBlue = _interopRequireDefault(require("@material-ui/core/colors/lightBlue"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var theme = (0, _styles2.createMuiTheme)({
  palette: {
    primary: _lightBlue["default"],
    secondary: {
      main: '#00796B'
    }
  }
});
/**
 * Binds the translationAcademy app to the window and proxies messages from
 * the main thread.
 */

function TranslationAcademyApp() {
  // closes the academy app
  function handleClose() {
    _electron.ipcRenderer.sendSync('academy-window', 'close');
  }

  function handleOpenLink(href) {
    _electron.shell.openExternal(href);
  }

  return _react["default"].createElement(_styles.ThemeProvider, {
    theme: theme
  }, _react["default"].createElement(_Academy["default"], {
    onClose: handleClose,
    onOpenLink: handleOpenLink
  }));
}

_reactDom["default"].render(_react["default"].createElement(TranslationAcademyApp, null), document.getElementById('react-app'));
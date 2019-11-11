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

var _Typography = _interopRequireDefault(require("@material-ui/core/Typography"));

var _styles = require("@material-ui/styles");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var useStyles = (0, _styles.makeStyles)(function (theme) {
  return {
    code: {
      padding: theme.spacing(3, 2),
      backgroundColor: '#efefef',
      borderRadius: 4,
      boxShadow: 'inset 0 0 10px #d0d0d0',
      color: '#444444',
      fontFamily: 'arial',
      fontSize: '80%',
      fontStyle: 'italic'
    }
  };
});

function ErrorDialog(props) {
  var onClose = props.onClose,
      open = props.open,
      title = props.title,
      error = props.error;
  var classes = useStyles();
  var message = error ? error.message : '';
  var errorMessage = error && error.error ? error.error.message : '';
  return _react["default"].createElement(_core.Dialog, {
    open: open,
    onClose: onClose,
    onEscapeKeyDown: onClose
  }, _react["default"].createElement(_DialogTitle["default"], null, title), _react["default"].createElement(_DialogContent["default"], null, _react["default"].createElement(_Typography["default"], null, message), _react["default"].createElement("p", {
    className: classes.code
  }, errorMessage)), _react["default"].createElement(_DialogActions["default"], null, _react["default"].createElement(_Button["default"], {
    onClick: onClose
  }, "Ok")));
}

ErrorDialog.propTypes = {
  title: _propTypes["default"].string,
  error: _propTypes["default"].shape({
    message: _propTypes["default"].string,
    error: _propTypes["default"].object
  }),
  onClose: _propTypes["default"].func.isRequired,
  open: _propTypes["default"].bool.isRequired
};
ErrorDialog.defaultProps = {
  title: '',
  error: {
    message: '',
    error: {}
  }
};
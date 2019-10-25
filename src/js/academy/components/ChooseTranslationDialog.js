"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ConfirmationDialogRaw = ConfirmationDialogRaw;
exports["default"] = ChooseTranslationDialog;

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _styles = require("@material-ui/core/styles");

var _Button = _interopRequireDefault(require("@material-ui/core/Button"));

var _DialogTitle = _interopRequireDefault(require("@material-ui/core/DialogTitle"));

var _DialogContent = _interopRequireDefault(require("@material-ui/core/DialogContent"));

var _DialogActions = _interopRequireDefault(require("@material-ui/core/DialogActions"));

var _Dialog = _interopRequireDefault(require("@material-ui/core/Dialog"));

var _RadioGroup = _interopRequireDefault(require("@material-ui/core/RadioGroup"));

var _Radio = _interopRequireDefault(require("@material-ui/core/Radio"));

var _FormControlLabel = _interopRequireDefault(require("@material-ui/core/FormControlLabel"));

var _Wifi = _interopRequireDefault(require("@material-ui/icons/Wifi"));

var _CloudDownload = _interopRequireDefault(require("@material-ui/icons/CloudDownload"));

var _Typography = _interopRequireDefault(require("@material-ui/core/Typography"));

var _util = require("../util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

var useRawStyles = (0, _styles.makeStyles)(function (theme) {
  return {
    leftIcon: {
      marginRight: theme.spacing(1)
    },
    listIcon: {// marginRight: theme.spacing(1)
    },
    label: {
      display: 'flex',
      width: '100%'
    },
    title: {
      flexGrow: 1
    },
    radio: {
      '&:hover': {
        backgroundColor: '#eee'
      }
    },
    labelRTL: {
      direction: 'rtl',
      display: 'flex',
      width: '100%'
    }
  };
});
/**
 * Renders a title with text in the correct position
 * based on the language direction.
 * @param props
 * @returns {*}
 * @constructor
 */

function LocalizedTitle(props) {
  var title = props.title,
      language = props.language,
      direction = props.direction,
      classes = props.classes;
  var displayedTitle = "".concat(title, " - ").concat(language);

  if (direction === 'rtl') {
    displayedTitle = "".concat(language, " - ").concat(title);
  }

  return _react["default"].createElement(_Typography["default"], {
    variant: "body1",
    className: classes.title
  }, displayedTitle);
}

function ConfirmationDialogRaw(props) {
  var onClose = props.onClose,
      onDelete = props.onDelete,
      onUpdate = props.onUpdate,
      initialValue = props.initialValue,
      options = props.options,
      open = props.open,
      other = _objectWithoutProperties(props, ["onClose", "onDelete", "onUpdate", "initialValue", "options", "open"]);

  var _useControlledProp = (0, _util.useControlledProp)(initialValue),
      _useControlledProp2 = _slicedToArray(_useControlledProp, 2),
      value = _useControlledProp2[0],
      setValue = _useControlledProp2[1];

  var keys = (0, _util.useKeyboard)();

  var radioGroupRef = _react["default"].useRef(null);

  var classes = useRawStyles();

  function handleEntering() {
    if (radioGroupRef.current != null) {
      radioGroupRef.current.focus();
    }
  }

  function handleCancel() {
    onClose(null);
  }

  function handleOk() {
    var translation = options.filter(function (o) {
      return o.language === value;
    })[0];

    if (keys.ctrlKey) {
      onDelete(translation);
    } else {
      onClose(translation);
    }
  }

  function handleClick(event) {
    setValue(event.target.value);
  }

  function handleUpdate() {
    onUpdate();
  }

  var instructions = '';

  if (options.length === 0) {
    instructions = 'You have not downloaded translationAcademy yet. Check for updates to download translationAcademy.';
  }

  return _react["default"].createElement(_Dialog["default"], _extends({
    disableBackdropClick: true,
    disableEscapeKeyDown: true,
    maxWidth: "xs",
    onEntering: handleEntering,
    "aria-labelledby": "confirmation-dialog-title",
    open: open
  }, other), _react["default"].createElement(_DialogTitle["default"], {
    id: "confirmation-dialog-title"
  }, "translationAcademy Translation"), _react["default"].createElement(_DialogContent["default"], {
    dividers: true
  }, instructions, _react["default"].createElement(_RadioGroup["default"], {
    ref: radioGroupRef,
    "aria-label": "ringtone",
    name: "ringtone",
    value: value
  }, options.map(function (option) {
    return _react["default"].createElement(_FormControlLabel["default"], {
      value: option.language,
      key: option.language,
      control: _react["default"].createElement(_Radio["default"], {
        onClick: handleClick
      }),
      classes: {
        label: option.direction === 'rtl' ? classes.labelRTL : classes.label,
        root: classes.radio
      },
      label: _react["default"].createElement(_react["default"].Fragment, null, _react["default"].createElement(LocalizedTitle, {
        title: option.title,
        language: option.language,
        direction: option.direction,
        classes: {
          title: classes.title
        }
      }), _react["default"].createElement(_CloudDownload["default"], {
        visibility: option.update || !option.downloaded ? 'visible' : 'hidden',
        className: classes.listIcon
      }))
    });
  }))), _react["default"].createElement(_DialogActions["default"], null, _react["default"].createElement(_Button["default"], {
    onClick: handleUpdate,
    color: "secondary"
  }, _react["default"].createElement(_Wifi["default"], {
    className: classes.leftIcon
  }), "Check for updates"), _react["default"].createElement(_Button["default"], {
    onClick: handleCancel,
    color: "primary"
  }, "Cancel"), _react["default"].createElement(_Button["default"], {
    onClick: handleOk,
    color: "primary",
    disabled: value === null
  }, keys.ctrlKey ? 'Delete' : 'Ok')));
}

ConfirmationDialogRaw.propTypes = {
  onClose: _propTypes["default"].func.isRequired,
  initialValue: _propTypes["default"].string,
  open: _propTypes["default"].bool.isRequired,
  onUpdate: _propTypes["default"].func.isRequired,
  onDelete: _propTypes["default"].func.isRequired,
  options: _propTypes["default"].array.isRequired
};
var useStyles = (0, _styles.makeStyles)(function (theme) {
  return {
    root: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: theme.palette.background.paper
    },
    paper: {
      width: '80%',
      maxHeight: 435
    }
  };
});

function ChooseTranslationDialog(props) {
  var classes = useStyles();
  return _react["default"].createElement(ConfirmationDialogRaw, _extends({
    classes: {
      paper: classes.paper
    },
    id: "translation-menu"
  }, props));
}

ChooseTranslationDialog.propTypes = {
  onClose: _propTypes["default"].func.isRequired,
  onUpdate: _propTypes["default"].func.isRequired,
  onDelete: _propTypes["default"].func.isRequired,
  initialValue: _propTypes["default"].string,
  options: _propTypes["default"].arrayOf(_propTypes["default"].shape({
    title: _propTypes["default"].string.isRequired,
    direction: _propTypes["default"].string.isRequired,
    language: _propTypes["default"].string.isRequired,
    update: _propTypes["default"].bool.isRequired,
    downloaded: _propTypes["default"].bool.isRequired
  }).isRequired),
  open: _propTypes["default"].bool.isRequired
};
ChooseTranslationDialog.defaultProps = {
  initialValue: 'en'
};
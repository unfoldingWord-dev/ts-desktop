"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useStableResize = useStableResize;

var _react = require("react");

var _lodash = require("lodash");

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

/**
 *
 * @param scrollRegion the element that will produce scroll events.
 */
function useStableResize(scrollRegion) {
  var _useState = (0, _react.useState)(),
      _useState2 = _slicedToArray(_useState, 2),
      visible = _useState2[0],
      setVisible = _useState2[1];

  var _useState3 = (0, _react.useState)({
    height: window.innerHeight,
    width: window.innerWidth
  }),
      _useState4 = _slicedToArray(_useState3, 2),
      size = _useState4[0],
      setSize = _useState4[1];

  var _useState5 = (0, _react.useState)({
    height: window.innerHeight,
    width: window.innerWidth
  }),
      _useState6 = _slicedToArray(_useState5, 2),
      lastSize = _useState6[0],
      setLastSize = _useState6[1];

  function isInBounds(elem, bounds) {
    var bounding = elem.getBoundingClientRect();
    return bounding.top >= 0 && bounding.left >= 0 && bounding.bottom <= bounds.bottom && bounding.right <= bounds.right;
  } // keep visible element in the viewport


  (0, _react.useEffect)(function () {
    if (visible && size.width !== lastSize.width && size.height !== lastSize.height) {
      visible.scrollIntoView();
      setLastSize(size);
    }
  }, [visible, size]); // monitor window size

  (0, _react.useEffect)(function () {
    function handleResize() {
      setSize({
        height: window.innerHeight,
        width: window.innerWidth
      });
    }

    window.addEventListener('resize', handleResize);
    return function () {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // keep track of the visible element

  (0, _react.useEffect)(function () {
    var handleScroll = (0, _lodash.debounce)(function () {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = scrollRegion.getElementsByTagName('*')[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var el = _step.value;

          if (isInBounds(el, scrollRegion.getBoundingClientRect())) {
            setVisible(el);
            break;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }, 50);

    if (scrollRegion !== null) {
      scrollRegion.addEventListener('scroll', handleScroll);
      return function () {
        scrollRegion.removeEventListener('scroll', handleScroll);
      };
    }
  }, [scrollRegion]);
}
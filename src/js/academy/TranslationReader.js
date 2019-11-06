"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _path = _interopRequireDefault(require("path"));

var _jsYaml = _interopRequireDefault(require("js-yaml"));

var _fs = _interopRequireDefault(require("fs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * Returns the contents of the file if it exists, otherwise null
 * @param filePath
 * @returns {string|null}
 */
function safeRead(filePath) {
  if (_fs["default"].existsSync(filePath)) {
    return _fs["default"].readFileSync(filePath).toString();
  } else {
    return null;
  }
}
/**
 * Returns an array of articles based on the section in a table of contents
 * @param section
 * @param dir
 * @param [handler] - optional callback to do extra processing for each article
 * @returns {[]}
 */


function readTOCSection(section, dir, handler) {
  var sectionArticles = [];

  if (section.link) {
    var articleDir = _path["default"].join(dir, section.link);

    var articleTitle = safeRead(_path["default"].join(articleDir, 'title.md'));
    var articleSubTitle = safeRead(_path["default"].join(articleDir, 'sub-title.md'));
    var articleBody = safeRead(_path["default"].join(articleDir, '01.md'));

    if (!articleBody) {
      throw new Error("Could not find the article '".concat(section.link, "'"));
    }

    var article = {
      path: articleDir,
      manualId: _path["default"].basename(dir),
      articleId: section.link,
      title: articleTitle,
      subTitle: articleSubTitle,
      body: articleBody
    };

    if (handler) {
      article = handler(article);
    }

    sectionArticles.push(article);
  } // recurse


  if (section.sections) {
    section.sections.forEach(function (s) {
      sectionArticles.push.apply(sectionArticles, readTOCSection(s, dir, handler));
    });
  }

  return sectionArticles;
}

var TranslationReader =
/*#__PURE__*/
function () {
  function TranslationReader(dir) {
    _classCallCheck(this, TranslationReader);

    this.dir = dir;
    this.listArticles = this.listArticles.bind(this);
    this.readManifest = this.readManifest.bind(this);
  }
  /**
   * @throws {Error} if the translation is corrupt
   * @returns {*}
   */


  _createClass(TranslationReader, [{
    key: "readManifest",
    value: function readManifest() {
      var manifestPath = _path["default"].join(this.dir, 'manifest.yaml');

      return _jsYaml["default"].safeLoad(_fs["default"].readFileSync(manifestPath, 'utf8'));
    }
    /**
     * Returns a list of article paths
     * @param [handler] - optional callback to do extra processing for each article.
     * @throws {Error} if the translation is corrupt.
     * @returns {[]}
     */

  }, {
    key: "listArticles",
    value: function listArticles() {
      var _this = this;

      var handler = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var manifest = this.readManifest();
      var articles = [];
      manifest.projects.forEach(function (p) {
        // load articles in each project
        var projectPath = _path["default"].join(_this.dir, p.path);

        var tocPath = _path["default"].join(projectPath, 'toc.yaml');

        if (_fs["default"].existsSync(tocPath)) {
          var toc = _jsYaml["default"].safeLoad(_fs["default"].readFileSync(tocPath, 'utf8'));

          if (toc) {
            toc.sections.forEach(function (s) {
              articles.push.apply(articles, readTOCSection(s, projectPath, handler));
            });
            return;
          }
        } // fallback to directory listing


        console.warn("Table of contents not found in ".concat(projectPath));

        var files = _fs["default"].readdirSync(projectPath);

        files.forEach(function (f) {
          var dir = _path["default"].join(projectPath, f);

          var isDir = _fs["default"].existsSync(dir) && _fs["default"].lstatSync(dir).isDirectory();

          if (isDir) {
            articles.push.apply(articles, readTOCSection({
              link: f
            }, projectPath, handler));
          }
        });
      });
      return articles;
    }
  }]);

  return TranslationReader;
}();

exports["default"] = TranslationReader;
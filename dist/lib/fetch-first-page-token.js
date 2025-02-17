'use strict';

var debug = require('debug')('fetch-first-page-token');
var Either = require('data.either');
var Task = require('data.task');
var prop = require('propper');

var eitherToTask = require('./utils/either-to-task');

var _require = require('./utils/cheerio-utils'),
    cheerioLoad = _require.cheerioLoad,
    cheerioFind = _require.cheerioFind,
    cheerioFindText = _require.cheerioFindText,
    cheerioAttr = _require.cheerioAttr;

var _require2 = require('./utils/string-utils'),
    regExec = _require2.regExec,
    strToInt = _require2.strToInt;

var _require3 = require('./youtube-api/youtube-api'),
    commentsWatchFragment = _require3.commentsWatchFragment;

var _require4 = require('./error-handler'),
    noCommentsError = _require4.noCommentsError,
    scraperError = _require4.scraperError;

var getWatchDiscussion = function getWatchDiscussion(res) {
  return Either.fromNullable(prop(res, 'body.watch-discussion')).leftMap(function (_) {
    return 'Invalid API response. Missing field "watch-discussion"';
  }).fold(Task.rejected, Task.of);
};

var extractButtonElement = function extractButtonElement($w) {
  return cheerioFind($w, '.comment-section-sort-menu li:nth-child(1) button.comment-section-sort-menu-item').leftMap(function (_) {
    return 'Cannot find "Newest First" button element in comment watch fragment:\n' + $w.html();
  });
};

var extractDataToken = function extractDataToken($btn) {
  return cheerioAttr($btn, 'data-token').leftMap(function (_) {
    return '"Newest First" button is missing attribute "data-token"';
  });
};

var extractToken = function extractToken($w) {
  return extractButtonElement($w).chain(extractDataToken).map(decodeURIComponent).fold(Task.rejected, Task.of);
};

var videoHasComments = function videoHasComments($w) {
  return cheerioFindText($w, '.comment-section-header-renderer').map(function (t) {
    return t.replace(/,/g, '');
  }).chain(function (t) {
    return regExec(/comments?\s*.\s*([\d,]+)/i, t);
  }).map(function (m) {
    return m[1];
  }).chain(strToInt).map(function (c) {
    return c > 0;
  }).leftMap(function (_) {
    return false;
  }).merge();
};

var buildNoCommentsError = function buildNoCommentsError(videoId) {
  return Task.rejected(noCommentsError({
    videoId: videoId,
    component: 'fetch-first-page-token',
    operation: 'extractToken'
  }));
};

var fetchFirstPageToken = function fetchFirstPageToken(videoId) {
  return commentsWatchFragment(videoId).chain(getWatchDiscussion).map(cheerioLoad).chain(eitherToTask).chain(function ($w) {
    return videoHasComments($w) ? extractToken($w) : buildNoCommentsError(videoId);
  }).rejectedMap(function (e) {
    return e.type ? e : scraperError({
      videoId: videoId,
      message: e,
      component: 'fetch-first-page-token',
      operation: 'fetch-first-page-token'
    });
  });
};

module.exports = fetchFirstPageToken;
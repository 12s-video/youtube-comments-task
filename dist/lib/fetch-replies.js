'use strict';

var Task = require('data.task');
var Either = require('data.either');
var debug = require('debug')('fetch-replies');

var _require = require('control.monads'),
    liftM2 = _require.liftM2;

var _require2 = require('./youtube-api/youtube-api'),
    commentReplies = _require2.commentReplies;

var _require3 = require('./utils/cheerio-utils'),
    cheerio = _require3.cheerio,
    cheerioFindAttr = _require3.cheerioFindAttr;

var parseReplies = require('./parse-replies');

var _require4 = require('./error-handler'),
    scraperError = _require4.scraperError;

var getRepliesToken = function getRepliesToken(comment) {
  return Either.fromNullable(comment.repliesToken).leftMap(function (e) {
    return 'Comment parameter object does not have a repliesToken field';
  }).fold(Task.rejected, Task.of);
};

var getContentHtml = function getContentHtml(r) {
  return Either.fromNullable(r.content_html).leftMap(function (_) {
    return 'Invalid Replies-API response, does not contain content_html field';
  }).fold(Task.rejected, Task.of);
};

var parseCommentReplies = function parseCommentReplies($replies) {
  return parseReplies($replies).orElse(function (e) {
    debug('Unable to parse comment replies: %s', e);
    return Either.of([]);
  }).fold(Task.rejected, Task.of);
};

var extractNextRepliesToken = function extractNextRepliesToken($content) {
  return cheerioFindAttr($content, '.load-more-button', 'data-uix-load-more-post-body').map(function (token) {
    return token.replace(/^page_token=/i, '');
  }).map(decodeURIComponent).orElse(function () {
    return Either.of(null);
  }).fold(Task.rejected, Task.of);
};

var fetchAllReplies = function fetchAllReplies(videoId, repliesToken) {
  return commentReplies(videoId, repliesToken).chain(getContentHtml).map(function (html) {
    return cheerio('<div>' + html + '</div>');
  }).chain(function ($replies) {
    return liftM2(function (replies, nextRepliesToken) {
      return { replies: replies, nextRepliesToken: nextRepliesToken };
    }, parseCommentReplies($replies), extractNextRepliesToken($replies));
  }).chain(function (_ref) {
    var replies = _ref.replies,
        nextRepliesToken = _ref.nextRepliesToken;
    return nextRepliesToken ? fetchAllReplies(videoId, nextRepliesToken).map(function (nextReplies) {
      return replies.concat(nextReplies);
    }) : Task.of(replies);
  });
};

var fetchReplies = function fetchReplies(videoId, comment) {
  return getRepliesToken(comment).chain(function (repliesToken) {
    return fetchAllReplies(videoId, repliesToken);
  }).rejectedMap(function (e) {
    return e.type ? e : scraperError({
      videoId: videoId,
      message: e,
      component: 'fetch-replies',
      operation: 'fetch-replies'
    });
  });
};

module.exports = fetchReplies;
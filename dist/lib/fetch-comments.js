'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var Either = require('data.either');
var Task = require('data.task');

var _require = require('ramda'),
    omit = _require.omit;

var fetchFirstPageToken = require('./fetch-first-page-token');
var fetchCommentPage = require('./fetch-comment-page');
var tokenizeComments = require('./tokenize-comments');
var parseCommentThread = require('./parse-comment-thread');
var fetchReplies = require('./fetch-replies');
var traverse = require('./utils/traverse-array');

var parseComments = function parseComments($commentThread) {
  return parseCommentThread($commentThread).fold(Task.rejected, Task.of);
};

var fetchCommentReplies = function fetchCommentReplies(videoId, comment) {
  return fetchReplies(videoId, comment).map(function (rs) {
    return rs && rs.length ? Either.of(rs) : Either.Left();
  }).map(function (re) {
    return re.map(function (replies) {
      return _extends({}, comment, {
        hasReplies: true,
        numReplies: replies.length,
        replies: replies
      });
    }).leftMap(function (_) {
      return _extends({}, omit(['repliesToken'], comment), {
        hasReplies: false
      });
    }).merge();
  });
};

var addReplies = function addReplies(videoId, comment) {
  return comment.hasReplies && !comment.replies ? fetchCommentReplies(videoId, comment).fold(function () {
    return comment;
  }, function (x) {
    return x;
  }) : Task.of(comment);
};

var fetchComments = function fetchComments(videoId, pageToken) {
  return Either.fromNullable(pageToken).leftMap(function (_) {
    return fetchFirstPageToken(videoId);
  }).map(function (t) {
    return Task.of(t);
  }).merge().chain(function (t) {
    return fetchCommentPage(videoId, t);
  }).chain(function (_ref) {
    var commentHtml = _ref.commentHtml,
        nextPageToken = _ref.nextPageToken;
    return tokenizeComments(commentHtml).chain(function (cs) {
      return traverse(cs, Task.of, parseComments);
    }).chain(function (cs) {
      return traverse(cs, Task.of, function (c) {
        return addReplies(videoId, c);
      });
    }).map(function (comments) {
      return _extends({}, { comments: comments }, nextPageToken ? { nextPageToken: nextPageToken } : {});
    });
  });
};

module.exports = fetchComments;
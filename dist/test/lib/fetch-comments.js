'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _require = require('chai'),
    expect = _require.expect;

var td = require('testdouble');
var Either = require('data.either');
var Task = require('data.task');

describe('/lib/fetch-replies', function () {
  afterEach(function () {
    td.reset();
  });

  it('exports a function', function () {
    var fetchComments = require('../../lib/fetch-comments');
    expect(fetchComments).to.be.a('function');
  });

  it('fetches a single first page (no pageToken provided)', function (done) {
    var videoId = 'videoId';
    var commentHtml = '<div>page1</div>';
    var commentPage = { commentHtml: commentHtml };
    var pageToken = 'token1';
    var commentPageTokens = ['ct1', 'ct2', 'ct3'];
    var comments = [{ id: 'c1', hasReplies: false }, { id: 'c2', hasReplies: true, numReplies: 3 }, { id: 'c3', hasReplies: true, numReplies: 2, replies: ['c3r1', 'c3r2'] }];
    var c2Replies = ['c2r1', 'c2r2', 'c2r3'];

    var fetchFirstPageToken = td.replace('../../lib/fetch-first-page-token');
    var fetchCommentPage = td.replace('../../lib/fetch-comment-page');
    var tokenizeComments = td.replace('../../lib/tokenize-comments');
    var parseCommentThread = td.replace('../../lib/parse-comment-thread');
    var fetchReplies = td.replace('../../lib/fetch-replies');
    var fetchComments = require('../../lib/fetch-comments');

    td.when(fetchFirstPageToken(videoId)).thenReturn(Task.of(pageToken));

    td.when(fetchCommentPage(videoId, pageToken)).thenReturn(Task.of(commentPage));

    td.when(tokenizeComments(commentHtml)).thenReturn(Either.of(commentPageTokens));

    comments.forEach(function (c, i) {
      td.when(parseCommentThread(commentPageTokens[i])).thenReturn(Either.of(c));
    });

    td.when(fetchReplies(videoId, comments[1])).thenReturn(Task.of(c2Replies));

    fetchComments(videoId).fork(function (e) {
      return done('Got an error: ' + e);
    }, function (res) {
      expect(res).to.have.property('comments');
      expect(res).not.to.have.property('nextPageToken');

      expect(res.comments).to.be.an('array').of.length(3);
      expect(res.comments[0]).to.deep.equal(comments[0]);
      expect(res.comments[1]).to.deep.equal(_extends({}, comments[1], { replies: c2Replies }));
      expect(res.comments[2]).to.deep.equal(comments[2]);
      done();
    });
  });

  it('fetches a page when given a pageToken', function (done) {
    var videoId = 'videoId';
    var commentHtml = '<div>page1</div>';
    var commentPage = { commentHtml: commentHtml };
    var pageToken = 'token1';
    var commentPageTokens = ['ct1', 'ct2', 'ct3'];
    var comments = [{ id: 'c1', hasReplies: false }, { id: 'c2', hasReplies: true, numReplies: 3 }, { id: 'c3', hasReplies: true, numReplies: 2, replies: ['c3r1', 'c3r2'] }];
    var c2Replies = ['c2r1', 'c2r2', 'c2r3'];

    var fetchFirstPageToken = td.replace('../../lib/fetch-first-page-token');
    var fetchCommentPage = td.replace('../../lib/fetch-comment-page');
    var tokenizeComments = td.replace('../../lib/tokenize-comments');
    var parseCommentThread = td.replace('../../lib/parse-comment-thread');
    var fetchReplies = td.replace('../../lib/fetch-replies');
    var fetchComments = require('../../lib/fetch-comments');

    td.when(fetchFirstPageToken(videoId)).thenDo(function () {
      done('fetchFirstPageToken should not be called');
      return Task.rejected('should not be called');
    });

    td.when(fetchCommentPage(videoId, pageToken)).thenReturn(Task.of(commentPage));

    td.when(tokenizeComments(commentHtml)).thenReturn(Either.of(commentPageTokens));

    comments.forEach(function (c, i) {
      td.when(parseCommentThread(commentPageTokens[i])).thenReturn(Either.of(c));
    });

    td.when(fetchReplies(videoId, comments[1])).thenReturn(Task.of(c2Replies));

    fetchComments(videoId, pageToken).fork(function (e) {
      return done('Got an error: ' + e);
    }, function (res) {
      expect(res).to.have.property('comments');
      expect(res).not.to.have.property('nextPageToken');

      expect(res.comments).to.be.an('array').of.length(3);
      expect(res.comments[0]).to.deep.equal(comments[0]);
      expect(res.comments[1]).to.deep.equal(_extends({}, comments[1], { replies: c2Replies }));
      expect(res.comments[2]).to.deep.equal(comments[2]);
      done();
    });
  });

  it('corrects reply fields for comments whose replies cannot be fetched', function (done) {
    var videoId = 'videoId';
    var commentHtml = '<div>page1</div>';
    var commentPage = { commentHtml: commentHtml };
    var pageToken = 'token1';
    var repliesToken = 'replies_token';
    var commentPageTokens = ['ct1'];
    var comments = [{ id: 'c1', hasReplies: true, repliesToken: repliesToken }];
    var c1Replies = [];

    var fetchFirstPageToken = td.replace('../../lib/fetch-first-page-token');
    var fetchCommentPage = td.replace('../../lib/fetch-comment-page');
    var tokenizeComments = td.replace('../../lib/tokenize-comments');
    var parseCommentThread = td.replace('../../lib/parse-comment-thread');
    var fetchReplies = td.replace('../../lib/fetch-replies');
    var fetchComments = require('../../lib/fetch-comments');

    td.when(fetchCommentPage(videoId, pageToken)).thenReturn(Task.of(commentPage));

    td.when(tokenizeComments(commentHtml)).thenReturn(Either.of(commentPageTokens));

    comments.forEach(function (c, i) {
      td.when(parseCommentThread(commentPageTokens[i])).thenReturn(Either.of(c));
    });

    td.when(fetchReplies(videoId, comments[0])).thenReturn(Task.of(c1Replies));

    fetchComments(videoId, pageToken).fork(function (e) {
      return done('Got an error: ' + e);
    }, function (res) {
      expect(res).to.have.property('comments');
      expect(res).not.to.have.property('nextPageToken');

      expect(res.comments).to.be.a('array').of.length(1);
      expect(res.comments[0]).to.deep.equal({ id: 'c1', hasReplies: false });
      done();
    });
  });

  it('does not fail if fetching replies fails', function (done) {
    var videoId = 'videoId';
    var commentHtml = '<div>page1</div>';
    var commentPage = { commentHtml: commentHtml };
    var pageToken = 'token1';
    var commentPageTokens = ['ct1'];
    var comments = [{ id: 'c2', hasReplies: true, numReplies: 3 }];
    var expectedError = 'the error';

    var fetchFirstPageToken = td.replace('../../lib/fetch-first-page-token');
    var fetchCommentPage = td.replace('../../lib/fetch-comment-page');
    var tokenizeComments = td.replace('../../lib/tokenize-comments');
    var parseCommentThread = td.replace('../../lib/parse-comment-thread');
    var fetchReplies = td.replace('../../lib/fetch-replies');
    var fetchComments = require('../../lib/fetch-comments');

    td.when(fetchCommentPage(videoId, pageToken)).thenReturn(Task.of(commentPage));

    td.when(tokenizeComments(commentHtml)).thenReturn(Either.of(commentPageTokens));

    comments.forEach(function (c, i) {
      td.when(parseCommentThread(commentPageTokens[i])).thenReturn(Either.of(c));
    });

    td.when(fetchReplies(videoId, comments[0])).thenReturn(Task.rejected(expectedError));

    fetchComments(videoId, pageToken).fork(function (e) {
      done('should not fail' + e);
    }, function (res) {
      expect(res).to.deep.equal({ comments: comments });
      done();
    });
  });
});
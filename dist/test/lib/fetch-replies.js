'use strict';

var _require = require('chai'),
    expect = _require.expect;

var td = require('testdouble');
var Task = require('data.task');
var moment = require('moment');

var _require2 = require('../sample-comment-html'),
    sampleReplies = _require2.sampleReplies;

var validateComment = function validateComment(comment, exp) {
  expect(comment).to.have.property('id', exp.id);
  expect(comment).to.have.property('author', exp.author);
  expect(comment).to.have.property('authorLink', exp.authorLink);
  expect(comment).to.have.property('authorThumb', exp.authorThumb);
  expect(comment).to.have.property('text', exp.text);
  expect(comment).to.have.property('likes', exp.likes);
  expect(comment).to.have.property('time', exp.time);
  expect(comment).to.have.property('timestamp').that.is.a('number').closeTo(exp.timestamp, 60 * 1000);
};

describe('/lib/fetch-first-page-token.js', function () {
  afterEach(function () {
    td.reset();
  });

  it('module exports a function', function () {
    var fetchReplies = require('../../lib/fetch-replies');
    expect(fetchReplies).to.be.a('function');
  });

  it('fails if comment does not have a repliesToken', function (done) {
    var videoId = 'videoId';
    var expectedError = { error: 'here' };
    var errorHandler = td.replace('../../lib/error-handler');
    var fetchReplies = require('../../lib/fetch-replies');

    td.when(errorHandler.scraperError({
      videoId: videoId,
      message: 'Comment parameter object does not have a repliesToken field',
      component: 'fetch-replies',
      operation: 'fetch-replies'
    })).thenReturn(expectedError);

    fetchReplies('videoId', { stuff: 'here' }).fork(function (e) {
      expect(e).to.deep.equal(expectedError);
      done();
    }, function (res) {
      expect.fail(res);
      done('expected not to succeed');
    });
  });

  it('fails if API response is invalid', function (done) {
    var videoId = 'videoId';
    var repliesToken = 'repliesToken';
    var expectedError = { error: 'here' };

    var Youtube = td.replace('../../lib/youtube-api/youtube-api');
    var errorHandler = td.replace('../../lib/error-handler');
    var fetchReplies = require('../../lib/fetch-replies');

    td.when(Youtube.commentReplies(videoId, repliesToken)).thenReturn(Task.of({ nonsense: 'yep' }));

    td.when(errorHandler.scraperError({
      videoId: videoId,
      message: 'Invalid Replies-API response, does not contain content_html field',
      component: 'fetch-replies',
      operation: 'fetch-replies'
    })).thenReturn(expectedError);

    fetchReplies('videoId', { repliesToken: repliesToken }).fork(function (e) {
      expect(e).to.deep.equal(expectedError);
      done();
    }, function (res) {
      expect.fail(res);
      done('expected not to succeed');
    });
  });

  it('fetches replies for a comment', function (done) {
    var videoId = 'videoId';
    var repliesToken = 'repliesToken';

    var replies = [{
      id: 'commentid.reply1id',
      author: 'reply1_author',
      authorLink: 'reply1_author_link',
      authorThumb: 'reply1_author_thumb',
      text: 'reply1_text',
      likes: 10,
      time: '10 hours ago',
      timestamp: parseInt(moment().subtract(10, 'hours').format('x'), 10)
    }, {
      id: 'commentid.reply2id',
      author: 'reply2_author',
      authorLink: 'reply2_author_link',
      authorThumb: 'reply2_author_thumb',
      text: 'reply2_text',
      likes: 0,
      time: '2 minutes ago',
      timestamp: parseInt(moment().subtract(2, 'minutes').format('x'), 10)
    }];

    var Youtube = td.replace('../../lib/youtube-api/youtube-api');
    var fetchReplies = require('../../lib/fetch-replies');

    td.when(Youtube.commentReplies(videoId, repliesToken)).thenReturn(Task.of({
      content_html: sampleReplies(replies)
    }));

    fetchReplies(videoId, { repliesToken: repliesToken }).fork(function (e) {
      expect.fail(e);
      done(e);
    }, function (result) {
      expect(result).to.be.an('array').of.length(2);
      result.forEach(function (r, i) {
        return validateComment(r, replies[i]);
      });
      done();
    });
  });

  it('Returns an empty array if replies cannot be parsed', function (done) {
    var videoId = 'videoId';
    var repliesToken = 'replies_token';

    var Youtube = td.replace('../../lib/youtube-api/youtube-api');
    var fetchReplies = require('../../lib/fetch-replies');

    td.when(Youtube.commentReplies(videoId, repliesToken)).thenReturn(Task.of({
      content_html: ''
    }));

    fetchReplies(videoId, { repliesToken: repliesToken }).fork(function (e) {
      done('not expected to fail ' + e);
    }, function (res) {
      expect(res).to.be.a('array').of.length(0);
      done();
    });
  });

  it('Fetches multiple pages of replies', function (done) {
    var videoId = 'videoId';
    var repliesToken = 'repliesToken';
    var nextRepliesToken = 'nextRepliesToken%3asd';

    var repliesPage1 = [{
      id: 'commentid.reply1id',
      author: 'reply1_author',
      authorLink: 'reply1_author_link',
      authorThumb: 'reply1_author_thumb',
      text: 'reply1_text',
      likes: 10,
      time: '10 hours ago',
      timestamp: parseInt(moment().subtract(10, 'hours').format('x'), 10)
    }, {
      id: 'commentid.reply2id',
      author: 'reply2_author',
      authorLink: 'reply2_author_link',
      authorThumb: 'reply2_author_thumb',
      text: 'reply2_text',
      likes: 0,
      time: '2 minutes ago',
      timestamp: parseInt(moment().subtract(2, 'minutes').format('x'), 10)
    }];

    var repliesPage2 = [{
      id: 'commentid.reply3id',
      author: 'reply3_author',
      authorLink: 'reply3_author_link',
      authorThumb: 'reply3_author_thumb',
      text: 'reply3_text',
      likes: 10,
      time: '10 hours ago',
      timestamp: parseInt(moment().subtract(10, 'hours').format('x'), 10)
    }, {
      id: 'commentid.reply4id',
      author: 'reply4_author',
      authorLink: 'reply4_author_link',
      authorThumb: 'reply4_author_thumb',
      text: 'reply4_text',
      likes: 0,
      time: '2 minutes ago',
      timestamp: parseInt(moment().subtract(2, 'minutes').format('x'), 10)
    }];

    var page1Html = sampleReplies(repliesPage1) + ('<button \n        class="load-more-button" \n        data-uix-load-more-post-body="page_token=' + encodeURIComponent(nextRepliesToken) + '">\n        Load more\n      </button>');

    var page2Html = sampleReplies(repliesPage2);

    var Youtube = td.replace('../../lib/youtube-api/youtube-api');
    var fetchReplies = require('../../lib/fetch-replies');

    td.when(Youtube.commentReplies(videoId, repliesToken)).thenReturn(Task.of({
      content_html: page1Html
    }));

    td.when(Youtube.commentReplies(videoId, nextRepliesToken)).thenReturn(Task.of({
      content_html: page2Html
    }));

    fetchReplies(videoId, { repliesToken: repliesToken }).fork(function (e) {
      expect.fail(e);
      done(e);
    }, function (result) {
      var allReplies = repliesPage1.concat(repliesPage2);

      expect(result).to.be.an('array').of.length(4);
      result.forEach(function (r, i) {
        return validateComment(r, allReplies[i]);
      });
      done();
    });
  });
});
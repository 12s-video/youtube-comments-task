'use strict';

var _require = require('chai'),
    expect = _require.expect;

var td = require('testdouble');
var Task = require('data.task');

describe('/lib/fetch-first-page-token.js', function () {
  afterEach(function () {
    td.reset();
  });

  it('module exports a function', function () {
    var fetchFirstPageToken = require('../../lib/fetch-first-page-token');
    expect(fetchFirstPageToken).to.be.a('function');
  });

  it('fetches the first page token', function (done) {
    var videoId = 'videoId';
    var pageToken = 'EhYSC2hfdGtJcHdic3hZwAEAyAEA4AEBGAYyEyIPIgtoX3RrSXB3YnN4WTABMAA%3D';
    var encodedPageToken = encodeURIComponent(pageToken);
    var html = '\n      <div class="comment-section-renderer">\n        <h2 class="comment-section-header-renderer" tabindex="0">\n          <b>Comments</b> \u2022 22<span class="alternate-content-link"></span>\n        </h2>\n        <div class="yt-uix-menu comment-section-sort-menu">\n          <button class="yt-uix-button yt-uix-button-size-default" type="button">Button</button>\n          <div class="yt-uix-menu-content yt-ui-menu-content" role="menu"\n            <ul tabindex="0" class="yt-uix-kbd-nav yt-uix-kbd-nav-list">\n              <li>\n                <button type="button" class="yt-ui-menu-item comment-section-sort-menu-item" data-token="WROOOONG" data-menu_name="n/a">\n                  Not it\n                </button>\n              </li>\n              <li>\n                <button type="button" class="yt-ui-menu-item comment-section-sort-menu-item" data-token="' + encodedPageToken + '" data-menu_name="n/a">\n                  Newest First\n                </button>\n              </li>\n            </ul>\n          </div>\n        </div>\n      </div>';

    var Youtube = td.replace('../../lib/youtube-api/youtube-api');
    var fetchFirstPageToken = require('../../lib/fetch-first-page-token');

    td.when(Youtube.commentsWatchFragment(videoId)).thenReturn(Task.of({ body: { 'watch-discussion': html } }));

    fetchFirstPageToken(videoId).fork(function (e) {
      done('ERROR: ' + JSON.stringify(e, null, 2));
    }, function (res) {
      expect(res).to.equal(pageToken);
      done();
    });
  });

  it('still succeeds if there is only one comment', function (done) {
    var videoId = 'videoId';
    var pageToken = 'EhYSC2hfdGtJcHdic3hZwAEAyAEA4AEBGAYyEyIPIgtoX3RrSXB3YnN4WTABMAA%3D';
    var encodedPageToken = encodeURIComponent(pageToken);
    var html = '\n      <div class="comment-section-renderer">\n        <h2 class="comment-section-header-renderer" tabindex="0">\n          <b>Comment</b> \u2022 1<span class="alternate-content-link"></span>\n        </h2>\n        <div class="yt-uix-menu comment-section-sort-menu">\n          <button class="yt-uix-button yt-uix-button-size-default" type="button">Button</button>\n          <div class="yt-uix-menu-content yt-ui-menu-content" role="menu"\n            <ul tabindex="0" class="yt-uix-kbd-nav yt-uix-kbd-nav-list">\n              <li>\n                <button type="button" class="yt-ui-menu-item comment-section-sort-menu-item" data-token="WROOOONG" data-menu_name="n/a">\n                  Not it\n                </button>\n              </li>\n              <li>\n                <button type="button" class="yt-ui-menu-item comment-section-sort-menu-item" data-token="' + encodedPageToken + '" data-menu_name="n/a">\n                  Newest First\n                </button>\n              </li>\n            </ul>\n          </div>\n        </div>\n      </div>';

    var Youtube = td.replace('../../lib/youtube-api/youtube-api');
    var fetchFirstPageToken = require('../../lib/fetch-first-page-token');

    td.when(Youtube.commentsWatchFragment(videoId)).thenReturn(Task.of({ body: { 'watch-discussion': html } }));

    fetchFirstPageToken(videoId).fork(function (e) {
      done('ERROR: ' + JSON.stringify(e, null, 2));
    }, function (res) {
      expect(res).to.equal(pageToken);
      done();
    });
  });

  it('task fails if API request fails', function (done) {
    var videoId = 'videoId';
    var errMessage = 'API request failed';
    var expectedError = { message: errMessage };

    var Youtube = td.replace('../../lib/youtube-api/youtube-api');
    var errorHandler = td.replace('../../lib/error-handler');
    var fetchFirstPageToken = require('../../lib/fetch-first-page-token');

    td.when(Youtube.commentsWatchFragment(videoId)).thenReturn(Task.rejected(errMessage));

    td.when(errorHandler.scraperError({
      videoId: videoId,
      message: errMessage,
      component: 'fetch-first-page-token',
      operation: 'fetch-first-page-token'
    })).thenReturn(expectedError);

    fetchFirstPageToken(videoId).fork(function (e) {
      expect(e).to.deep.equal(expectedError);
      done();
    }, function (res) {
      return done('expected to fail');
    });
  });

  it('task fails if API response is invalid', function (done) {
    var videoId = 'videoId';
    var expectedError = { error: 'here' };

    var Youtube = td.replace('../../lib/youtube-api/youtube-api');
    var errorHandler = td.replace('../../lib/error-handler');
    var fetchFirstPageToken = require('../../lib/fetch-first-page-token');

    td.when(Youtube.commentsWatchFragment(videoId)).thenReturn(Task.of({ nothing: 'here' }));

    td.when(errorHandler.scraperError({
      videoId: videoId,
      message: 'Invalid API response. Missing field "watch-discussion"',
      component: 'fetch-first-page-token',
      operation: 'fetch-first-page-token'
    })).thenReturn(expectedError);

    fetchFirstPageToken(videoId).fork(function (e) {
      expect(e).to.deep.equal(expectedError);
      done();
    }, function (res) {
      return done('expected to fail');
    });
  });

  it('task fails if the watch-discussion html is invalid', function (done) {
    var videoId = 'videoId';
    var html = '<html>Some random HTML</html>';

    var Youtube = td.replace('../../lib/youtube-api/youtube-api');
    var fetchFirstPageToken = require('../../lib/fetch-first-page-token');

    td.when(Youtube.commentsWatchFragment(videoId)).thenReturn(Task.of({ body: { 'watch-discussion': html } }));

    fetchFirstPageToken(videoId).fork(function (e) {
      expect(e).to.be.a('object').that.has.property('type', 'video-error/no-comments');
      done();
    }, function (res) {
      return done('expected to fail');
    });
  });

  it('task fails if there are no comments', function (done) {
    var videoId = 'videoId';
    var expectedError = { type: 'error', error: 'here' };
    var html = '\n      <div class="comment-section-renderer">\n        <h2 class="comment-section-header-renderer" tabindex="0">\n          <b>Comments</b><span class="alternate-content-link"></span>\n        </h2>\n        <div class="yt-uix-menu comment-section-sort-menu">\n        </div>\n      </div>';

    var Youtube = td.replace('../../lib/youtube-api/youtube-api');
    var errorHandler = td.replace('../../lib/error-handler');
    var fetchFirstPageToken = require('../../lib/fetch-first-page-token');

    td.when(Youtube.commentsWatchFragment(videoId)).thenReturn(Task.of({ body: { 'watch-discussion': html } }));

    td.when(errorHandler.noCommentsError({
      videoId: videoId,
      component: 'fetch-first-page-token',
      operation: 'extractToken'
    })).thenReturn(expectedError);

    fetchFirstPageToken(videoId).fork(function (e) {
      expect(e).to.deep.equal(expectedError);
      done();
    }, function (res) {
      done('Task should not complete.');
    });
  });

  it('task fails if content_html does not contain a "Newest First" button', function (done) {
    var videoId = 'videoId';
    var expectedError = { type: 'error', error: 'here' };
    var html = '\n      <div class="comment-section-renderer">\n        <h2 class="comment-section-header-renderer" tabindex="0">\n          <b>Comments</b> \u2022 22<span class="alternate-content-link"></span>\n        </h2>\n        <div class="yt-uix-menu comment-section-sort-menu">\n        </div>\n      </div>';

    var Youtube = td.replace('../../lib/youtube-api/youtube-api');
    var errorHandler = td.replace('../../lib/error-handler');
    var fetchFirstPageToken = require('../../lib/fetch-first-page-token');

    td.when(Youtube.commentsWatchFragment(videoId)).thenReturn(Task.of({ body: { 'watch-discussion': html } }));

    td.when(errorHandler.scraperError(td.matchers.contains({
      videoId: videoId,
      component: 'fetch-first-page-token',
      operation: 'fetch-first-page-token'
    }))).thenReturn(expectedError);

    fetchFirstPageToken(videoId).fork(function (e) {
      expect(e).to.deep.equal(expectedError);
      done();
    }, function (res) {
      done('Task should not complete.');
    });
  });

  it('task fails if "Newest First" button does not have a "data-token" attribute', function (done) {
    var videoId = 'videoId';
    var expectedError = { type: 'error', error: 'here' };
    var html = '\n      <div class="comment-section-renderer">\n        <h2 class="comment-section-header-renderer" tabindex="0">\n          <b>Comments</b> \u2022 22<span class="alternate-content-link"></span>\n        </h2>\n        <div class="yt-uix-menu comment-section-sort-menu">\n          <button class="yt-uix-button yt-uix-button-size-default" type="button">Button</button>\n          <div class="yt-uix-menu-content yt-ui-menu-content" role="menu"\n            <ul tabindex="0" class="yt-uix-kbd-nav yt-uix-kbd-nav-list">\n              <li>\n                <button type="button" class="yt-ui-menu-item comment-section-sort-menu-item" data-token="WROOOONG" data-menu_name="n/a">\n                  Not it\n                </button>\n              </li>\n              <li>\n                <button type="button" class="yt-ui-menu-item comment-section-sort-menu-item" data-menu_name="n/a">\n                  Newest First\n                </button>\n              </li>\n            </ul>\n          </div>\n        </div>\n      </div>';

    var Youtube = td.replace('../../lib/youtube-api/youtube-api');
    var errorHandler = td.replace('../../lib/error-handler');
    var fetchFirstPageToken = require('../../lib/fetch-first-page-token');

    td.when(Youtube.commentsWatchFragment(videoId)).thenReturn(Task.of({ body: { 'watch-discussion': html } }));

    td.when(errorHandler.scraperError(td.matchers.contains({
      videoId: videoId,
      component: 'fetch-first-page-token',
      operation: 'fetch-first-page-token'
    }))).thenReturn(expectedError);

    fetchFirstPageToken(videoId).fork(function (e) {
      expect(e).to.deep.equal(expectedError);
      done();
    }, function (res) {
      done('Task should not complete.');
    });
  });
});
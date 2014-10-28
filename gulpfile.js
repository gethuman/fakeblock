/**
 * Author: Jeff Whelpley
 * Date: 2/25/14
 *
 * Build for fakeblock
 */
var gulp    = require('gulp');
var taste   = require('taste');

taste.init({
    gulp:       gulp,
    rootDir:    __dirname + '/lib',
    loadModule: require
});

gulp.task('default', ['jshint', 'test']);

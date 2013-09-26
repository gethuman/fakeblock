/**
 * Copyright 2013 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 9/25/13
 *
 * Grunt file for running tests, jshint and any other build steps
 */
module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({

        jshint: {
            options: {
                curly:      true,
                eqeqeq:     true,
                immed:      true,
                latedef:    true,
                newcap:     true,
                noarg:      true,
                sub:        true,
                undef:      true,
                boss:       true,
                eqnull:     true,
                browser:    true,
                globals: {
                    angular:    true,
                    jQuery:     true,
                    module:     true,
                    exports:    true,
                    emit:       true,
                    require:    true,
                    process:    true,
                    describe:   true,
                    before:     true,
                    beforeEach: true,
                    after:      true,
                    afterEach:  true,
                    it:         true,
                    __dirname:  true,
                    console:    true
                }
            },
            uses_defaults: [
                'lib/**/*.js'
            ]
        },

        mochaTest: {
            options: {
                growl: true,
                ui: 'bdd',
                reporter: 'progress',
                timeout: 5000
            },
            all: {
                src: ['test/**/*.js']
            }
        },

        watch: {
            all: {
                files: [
                    'lib/**/*.js'
                ],
                tasks: ['default']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.registerTask('test', ['mochaTest']);
    grunt.registerTask('default', ['jshint', 'mochaTest']);
};
/**
 * Copyright 2013 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 8/19/13
 *
 * Unit test
 */
var chai            = require('chai');
var should          = chai.should();
var objectFilter    = require('../lib/field.object.filter');

describe('UNIT fakeblock/lib/field.object.filter', function() {

    describe('removeFields()', function() {
        it('should remove fields from data', function () {
            var testData = {
                foo: {
                    man: {
                        choo: {
                            another: 'val'
                        }
                    },
                    some: 'thing'
                },
                another: 'thing'
            };
            var fieldsToRemove = ['foo.some', 'foo.man.choo'];
            var expectedData = {
                foo: {
                    man: {}
                },
                another: 'thing'
            };

            var actualData = objectFilter.removeFields(testData, fieldsToRemove);
            should.exist(actualData);
            actualData.should.deep.equal(expectedData);
        });
    });

    describe('getFields()', function () {
        it('should get fields from data', function() {
            var testData = {
                foo: {
                    man: {
                        choo: {
                            another: 'val'
                        }
                    },
                    some: 'thing'
                },
                another: 'thing'
            };
            var fieldsToGet = ['foo.man', 'another'];
            var expectedData = {
                foo: {
                    man: {
                        choo: {
                            another: 'val'
                        }
                    }
                },
                another: 'thing'
            };

            var actualData = objectFilter.getFields(testData, fieldsToGet);
            should.exist(actualData);
            actualData.should.deep.equal(expectedData);
        });
    });
});
/**
 * Author: Jeff Whelpley
 * Date: 8/19/13
 *
 * Unit tests for Fakeblock
 */
var taste = require('../taste');
var fieldFilter = taste.target('field.filter');

describe('UNIT field.filter', function () {

    describe('removeItemsFromList()', function () {
        it('should remove items from a list', function () {
            var list = ['foo.man.choo', 'foo.la.loo', 'foo.man.choo.roo', 'foo.la.loo.roo', 'foo.la.zoo'];
            var itemsToRemove = ['foo.man', 'foo.la.zoo'];
            var expected = ['foo.la.loo', 'foo.la.loo.roo'];
            var actual = fieldFilter.removeItemsFromList(list, itemsToRemove) || [];
            actual.should.deep.equal(expected);
        });
    });

    describe('getItemsFromList()', function () {
        it('should get items from a list', function () {
            var list = ['foo.man.choo', 'foo.la.loo', 'foo.man.choo.roo', 'foo.la.loo.roo', 'foo.la.zoo'];
            var itemsToGet = ['foo.man', 'foo.la.zoo'];
            var expected = ['foo.man.choo', 'foo.man.choo.roo', 'foo.la.zoo'];
            var actual = fieldFilter.getItemsFromList(list, itemsToGet) || [];
            actual.should.deep.equal(expected);
        });
    });

    describe('removeFieldsFromObj()', function () {
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
            var fieldsToRemove = ['foo.some', 'foo.man.choo', 'blah'];
            var expectedData = {
                foo: {
                    man: {}
                },
                another: 'thing'
            };

            var actualData = fieldFilter.removeFieldsFromObj(testData, fieldsToRemove) || {};
            actualData.should.deep.equal(expectedData);
        });
    });

    describe('getFieldsFromObj()', function () {
        it('should get fields from data', function () {
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
            var fieldsToGet = ['foo.man', 'another', 'zoom'];
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

            var actualData = fieldFilter.getFieldsFromObj(testData, fieldsToGet) || {};
            actualData.should.deep.equal(expectedData);
        });
    });

    describe('applyFilter()', function () {
        it('should just return back the data if no restricted or allowed fields', function () {
            var data = { test: 'yes' };
            var actual = fieldFilter.applyFilter(data, null, null) || {};
            actual.should.deep.equal(data);
        });

        it('should call removeItemsFromList if restricted fields and an array', function () {
            var list = ['foo.man.choo', 'foo.la.loo', 'foo.man.choo.roo', 'foo.la.loo.roo', 'foo.la.zoo'];
            var itemsToRemove = ['foo.man', 'foo.la.zoo'];
            var expected = ['foo.la.loo', 'foo.la.loo.roo'];
            var actual = fieldFilter.applyFilter(list, itemsToRemove, null) || [];
            actual.should.deep.equal(expected);
        });

        it('should call removeFieldsFromObj if restricted + is obj', function () {
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
                var fieldsToRemove = ['foo.some', 'foo.man.choo', 'blah'];
                var expectedData = {
                    foo: {
                        man: {}
                    },
                    another: 'thing'
                };

                var actualData = fieldFilter.applyFilter(testData, fieldsToRemove, null) || {};
                actualData.should.deep.equal(expectedData);
            });
        });

        it('should call getItemsFromList if allowed and array', function () {
            var list = ['foo.man.choo', 'foo.la.loo', 'foo.man.choo.roo', 'foo.la.loo.roo', 'foo.la.zoo'];
            var itemsToGet = ['foo.man', 'foo.la.zoo'];
            var expected = ['foo.man.choo', 'foo.man.choo.roo', 'foo.la.zoo'];
            var actual = fieldFilter.applyFilter(list, null, itemsToGet) || [];
            actual.should.deep.equal(expected);
        });

        it('should call getFieldsFromObj if allowed + is obj', function () {
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
            var fieldsToGet = ['foo.man', 'another', 'zoom'];
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

            var actualData = fieldFilter.applyFilter(testData, null, fieldsToGet) || {};
            actualData.should.deep.equal(expectedData);
        });
    });
});

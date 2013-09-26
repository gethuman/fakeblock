/**
 * Copyright 2013 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 8/19/13
 *
 * Unit test
 */
var chai            = require('chai');
var should          = chai.should();
var listFilter      = require('../lib/field.list.filter');

describe('UNIT fakeblock/lib/field.list.filter', function() {

    it('should remove items from a list', function () {
        var list = ['foo.man.choo', 'foo.la.loo', 'foo.man.choo.roo', 'foo.la.loo.roo', 'foo.la.zoo'];
        var itemsToRemove = ['foo.man', 'foo.la.zoo'];
        var expectedList = ['foo.la.loo', 'foo.la.loo.roo'];
        var actualList = listFilter.removeItems(list, itemsToRemove);
        should.exist(actualList);
        actualList.should.deep.equal(expectedList);
    });

    it('should get items from a list', function () {
        var list = ['foo.man.choo', 'foo.la.loo', 'foo.man.choo.roo', 'foo.la.loo.roo', 'foo.la.zoo'];
        var itemsToGet = ['foo.man', 'foo.la.zoo'];
        var expectedList = ['foo.man.choo', 'foo.man.choo.roo', 'foo.la.zoo'];
        var actualList = listFilter.getItems(list, itemsToGet);
        should.exist(actualList);
        actualList.should.deep.equal(expectedList);
    });
});
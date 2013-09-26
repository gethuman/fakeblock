/**
 * Copyright 2013 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 8/19/13
 *
 * Unit test
 */
var chai        = require('chai');
var should      = chai.should();
var Fakeblock   = require('../lib/fakeblock');
var testConfig = {
    create: {
        access:             ['admin', 'user', 'visitor'],
        restricted: {
            user:           ['name', 'tags', 'country']
        },
        allowed: {
            visitor:        ['name', 'legacyId']
        }
    },
    retrieve: {
        access:             ['admin', 'user', 'visitor', 'device', 'partner'],
        onlyMine:           ['device'],
        select: {
            restricted: {
                user:       ['features', 'family', 'modifyDate', 'modifyUserId', 'modifyType']
            },
            allowed: {
                visitor:    ['features', 'family', 'modify']
            },
            'default': {
                user:       '-features -family -modifyUserId -modifyUserType',
                visitor:    '-features -family -modifyUserId -modifyUserType',
                device:     '-features -family -modifyUserId -modifyUserType -offerings -locations',
                partner:    '-features -family -modifyUserId -modifyUserType'
            }
        },
        where: {
            allowed:        ['_id', 'name', 'legacyId', 'tags', 'country', 'features',
                'slug', 'previousSlugs', 'status']
        },
        sort: {
            allowed:        ['stats.rank.overall', 'createDate', 'name'],
            'default':      'stats.rank.overall'
        }
    },
    update: {
        access:             ['admin', 'user', 'visitor'],
        onlyMine:           ['device'],
        restricted: {
            user:           ['name', 'tags', 'country']
        },
        allowed: {
            visitor:        ['name', 'legacyId']
        }
    },
    del: {
        access:             ['admin']
    }
};

describe('UNIT fakeblock/lib/fakeblock', function() {

    describe('getValue()', function() {
        it('should get a value from a crud config file', function() {
            var fakeblock = new Fakeblock('companies', testConfig);
            var actualValue = fakeblock.getValue('retrieve.select.default.user');
            should.exist(actualValue);
            actualValue.should.equal(testConfig.retrieve.select['default'].user);
        });
    });

    describe('filterCreateFields()', function() {
        it('should filter create fields based on the restricted values', function() {
            var fakeblock = new Fakeblock('companies', testConfig);
            var data = {
                name: 'blah',
                tags: ['tag1', 'tag2'],
                legacyId: 123
            };
            var expectedValue = {
                legacyId: 123
            };
            var actualValue = fakeblock.filterCreateFields(data, 'user');
            should.exist(actualValue);
            actualValue.should.deep.equal(expectedValue);
        });

        it('should filter create fields based on allowed values', function() {
            var fakeblock = new Fakeblock('companies', testConfig);
            var data = {
                name: 'blah',
                tags: ['tag1', 'tag2'],
                legacyId: 123
            };
            var expectedValue = {
                name: 'blah',
                legacyId: 123
            };
            var actualValue = fakeblock.filterCreateFields(data, 'visitor');
            should.exist(actualValue);
            actualValue.should.deep.equal(expectedValue);
        });

        it('should filter create fields for user with full access', function() {
            var fakeblock = new Fakeblock('companies', testConfig);
            var data = {
                name: 'blah',
                tags: ['tag1', 'tag2'],
                legacyId: 123,
                anotherBlahBlahBlah: 'asdf'
            };
            var actualValue = fakeblock.filterCreateFields(data, 'admin');
            should.exist(actualValue);
            actualValue.should.deep.equal(data);
        });
    });

    describe('getDefaultSelectFields()', function() {
        it('should get default select values', function() {
            var fakeblock = new Fakeblock('companies', testConfig);
            var actualValue = fakeblock.getDefaultSelectFields('user');
            should.exist(actualValue);
            actualValue.should.equal(testConfig.retrieve.select['default'].user);
        });
    });

    describe('filterSelectFields()', function() {
        it('should filter select fields using restricted', function() {
            var fakeblock = new Fakeblock('companies', testConfig);
            var selectFields = 'name,tags,features,family,modifyDate,blah';
            var expectedValue = 'name tags blah';
            var actualValue = fakeblock.filterSelectFields(selectFields, 'user');
            should.exist(actualValue);
            actualValue.should.equal(expectedValue);
        });

        it('should filter select fields using allowed', function() {
            var fakeblock = new Fakeblock('companies', testConfig);
            var selectFields = 'name,tags,features,family';
            var expectedValue = 'features family';
            var actualValue = fakeblock.filterSelectFields(selectFields, 'visitor');
            should.exist(actualValue);
            actualValue.should.equal(expectedValue);
        });
    });

    describe('removeFilteredFields()', function() {
        it('should filter object fields using restricted', function() {
            var fakeblock = new Fakeblock('companies', testConfig);
            var selectFields = {
                name: 'blah',
                tags: 'blah',
                features: 'blah',
                family: 'blah',
                modifyDate: 'blah',
                blah: 'blah'
            };
            var expectedValue = {
                name: 'blah',
                tags: 'blah',
                blah: 'blah'
            };

            var actualValue = fakeblock.removeFilteredFields(selectFields, 'user');
            should.exist(actualValue);
            actualValue.should.deep.equal(expectedValue);
        });

        it('should filter object fields using allowed', function() {
            var fakeblock = new Fakeblock('companies', testConfig);
            var selectFields = {
                name: 'blah',
                tags: 'blah',
                features: 'blah',
                family: 'blah'
            };
            var expectedValue = {
                features: 'blah',
                family: 'blah'
            };

            var actualValue = fakeblock.removeFilteredFields(selectFields, 'visitor');
            should.exist(actualValue);
            actualValue.should.deep.equal(expectedValue);
        });
    });

    describe('filterConditions()', function() {
        it('should make sure all conditions are from allowed list', function() {
            var fakeblock = new Fakeblock('companies', testConfig);
            var conditions = {
                name: { '$in': ['val'] },
                tags: 'blah',
                anotherField: {
                    duh: 'blasdf'
                }
            };
            var expectedValue= {
                name: { '$in': ['val'] },
                tags: 'blah'
            };
            var actualValue = fakeblock.filterConditions(conditions);
            should.exist(actualValue);
            actualValue.should.deep.equal(expectedValue);
        });
    });

    describe('conditionsAreValid()', function() {
        it('should validate that a given set of conditions are valid', function() {
            var fakeblock = new Fakeblock('companies', testConfig);
            var conditions = {
                name: { '$in': ['val'] },
                tags: 'blah',
                anotherField: {
                    duh: 'blasdf'
                }
            };
            var actualValue = fakeblock.conditionsAreValid(conditions);
            should.exist(actualValue);
            return actualValue.should.be['false'];
        });
    });

    describe('onlyGetMyStuff()', function() {
        it('should return true if role in list for only selecting their own stuff', function() {
            var fakeblock = new Fakeblock('companies', testConfig);

            var deviceMyStuff = fakeblock.onlyGetMyStuff('device');
            should.exist(deviceMyStuff);

            var adminMyStuff = fakeblock.onlyGetMyStuff('admin');
            should.exist(adminMyStuff);

            return deviceMyStuff.should.be['true'] && adminMyStuff.should.be['false'];

        });
    });

    describe('onlyUpdateMyStuff()', function() {
        it('should return true if role in list for only updating their own stuff', function() {
            var fakeblock = new Fakeblock('companies', testConfig);

            var deviceMyStuff = fakeblock.onlyUpdateMyStuff('device');
            should.exist(deviceMyStuff);

            var adminMyStuff = fakeblock.onlyUpdateMyStuff('admin');
            should.exist(adminMyStuff);

            return deviceMyStuff.should.be['true'] && adminMyStuff.should.be['false'];
        });
    });

    describe('filterUpdateFields()', function() {
        it('filter update fields based on the restricted values', function() {
            var fakeblock = new Fakeblock('companies', testConfig);
            var data = {
                name: 'blah',
                tags: ['tag1', 'tag2'],
                legacyId: 123
            };
            var expectedValue = {
                legacyId: 123
            };
            var actualValue = fakeblock.filterUpdateFields(data, 'user');
            should.exist(actualValue);
            actualValue.should.deep.equal(expectedValue);
        });

        it('filter update fields based on allowed values', function() {
            var fakeblock = new Fakeblock('companies', testConfig);
            var data = {
                name: 'blah',
                tags: ['tag1', 'tag2'],
                legacyId: 123
            };
            var expectedValue = {
                name: 'blah',
                legacyId: 123
            };
            var actualValue = fakeblock.filterUpdateFields(data, 'visitor');
            should.exist(actualValue);
            actualValue.should.deep.equal(expectedValue);
        });

        it('filter create fields for user with full access', function() {
            var fakeblock = new Fakeblock('companies', testConfig);
            var data = {
                name: 'blah',
                tags: ['tag1', 'tag2'],
                legacyId: 123,
                anotherBlahBlahBlah: 'asdf'
            };
            var actualValue = fakeblock.filterUpdateFields(data, 'admin');
            should.exist(actualValue);
            actualValue.should.deep.equal(data);
        });
    });

    describe('validateSortElseUseDefault()', function() {
        it('should get default select values', function() {
            var fakeblock = new Fakeblock('companies', testConfig);

            var sortField = 'createDate';
            var actualValue = fakeblock.validateSortElseUseDefault(sortField);
            should.exist(actualValue);
            actualValue.should.equal(sortField);

            sortField = '-createDate';
            actualValue = fakeblock.validateSortElseUseDefault(sortField);
            should.exist(actualValue);
            actualValue.should.equal(sortField);

            sortField = 'blahblahblah';
            actualValue = fakeblock.validateSortElseUseDefault(sortField);
            should.exist(actualValue);
            actualValue.should.equal(testConfig.retrieve.sort['default']);
        });
    });
});

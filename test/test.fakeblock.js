/**
 * Author: Jeff Whelpley
 * Date: 2/17/14
 *
 * Unit tests for fakeblock
 */
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var fakeblock = require('../lib/fakeblock');

describe('UNIT lib/fakeblock', function () {
    describe('getValue()', function () {
        it('should return null if a key does not exist', function() {
            var config = { one: 'two' };
            var actual = fakeblock.getValue(config, 'something.else');
            expect(actual).not.to.exist;
        });

        it('should return a value if it exists', function() {
            var config = { one: { two: ['three', 'four'] }};
            var expected = ['three', 'four'];
            var actual = fakeblock.getValue(config, 'one.two');
            expect(actual).to.exist;
            actual.should.deep.equal(expected);
        });
    });

    describe('canUserAccessMethod()', function () {
        it('should return false if role not there at all', function() {
            var config = { one: { two: 'three' }};
            var actual = fakeblock.canUserAccessMethod(config, 'user', 'find');
            actual.should.be.false;
        });

        it('should return false if the role is not in the list', function() {
            var config = { find: { access: ['admin'] }};
            var actual = fakeblock.canUserAccessMethod(config, 'user', 'find');
            actual.should.be.false;
        });

        it('should return true if the role is in the list', function() {
            var config = { find: { access: ['user'] }};
            var actual = fakeblock.canUserAccessMethod(config, 'user', 'find');
            actual.should.be.true;
        });
    });

    describe('applyAcl()', function () {
        it('should throw an error if data is missing', function() {
            var fn = function () {
                fakeblock.applyAcl();
            };
            expect(fn).to.throw(/Fakeblock missing required input/);
        });
        
        it('should return the default fields if data does not exist', function() {
            var config = { find: { select: { 'default': { user: ['one', 'two'] }}}};
            var expected = ['one', 'two'];
            var actual = fakeblock.applyAcl('test', config, 123, 'user', 'find', 'select', null);
            expect(actual).to.exist;
            actual.should.deep.equal(expected);
        });

        it('should automatically add condition if isMine', function() {
            var config = { find: { select: { onlyMine: { roles: ['user'], field: 'someField' }}}};
            var userId = 123;
            var expected = { someField: 123 };
            var actual = fakeblock.applyAcl('test', config, userId, 'user', 'find', 'select', null);
            expect(actual).to.exist;
            actual.should.deep.equal(expected);
        });

        it('should throw error if block with user role restricted fields', function() {
            var config = { find: { select: { restricted: { user: ['something'] }}}};
            var data = { something: 'one', another: 'two' };
            var fn = function() {
                fakeblock.applyAcl('test', config, 123, 'user', 'find', 'select', data);
            };
            expect(fn).to.throw(/Fakeblock blocked.*{\"something\":\"one\"}/);
        });

        it('should throw error if block with allroles restricted fields', function() {
            var config = { find: { select: { restricted: { allroles: ['something'] }}}};
            var data = { something: 'one', another: 'two' };
            var fn = function() {
                fakeblock.applyAcl('test', config, 123, 'user', 'find', 'select', data);
            };
            expect(fn).to.throw(/Fakeblock blocked.*{\"something\":\"one\"}/);
        });

        it('should throw error if block with user role allowed fields', function() {
            var config = { find: { select: { allowed: { user: ['another'] }}}};
            var data = { something: 'one', another: 'two' };
            var fn = function() {
                fakeblock.applyAcl('test', config, 123, 'user', 'find', 'select', data);
            };
            expect(fn).to.throw(/Fakeblock blocked.*{\"something\":\"one\"}/);
        });

        it('should throw error if block with allroles role allowed fields', function() {
            var config = { find: { select: { allowed: { allroles: ['another'] }}}};
            var data = { something: 'one', another: 'two' };
            var fn = function() {
                fakeblock.applyAcl('test', config, 123, 'user', 'find', 'select', data);
            };
            expect(fn).to.throw(/Fakeblock blocked.*{\"something\":\"one\"}/);
        });
    });
});

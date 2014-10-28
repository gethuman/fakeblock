/**
 * Author: Jeff Whelpley
 * Date: 2/17/14
 *
 * Unit tests for fakeblock
 */
var taste = require('taste');
var Fakeblock = taste.target('fakeblock');

describe('UNIT tests for fakeblock', function () {
    describe('getValue()', function () {
        it('should return null if a key does not exist', function () {
            var acl = { one: 'two' };
            var fakeblock = new Fakeblock({ acl: acl });
            var actual = fakeblock.getValue('something.else');
            taste.expect(actual).not.to.exist;
        });

        it('should return a value if it exists', function () {
            var acl = { one: { two: ['three', 'four'] }};
            var fakeblock = new Fakeblock({ acl: acl });
            var expected = ['three', 'four'];
            var actual = fakeblock.getValue('one.two');
            taste.expect(actual).to.exist;
            actual.should.deep.equal(expected);
        });
    });

    describe('canUserAccessMethod()', function () {
        it('should return false if role not there at all', function () {
            var acl = { one: { two: 'three' }};
            var fakeblock = new Fakeblock({ acl: acl, userRole: 'user' });
            var actual = fakeblock.canUserAccessMethod('find');
            actual.should.be.false;
        });

        it('should return false if the role is not in the list', function () {
            var acl = { find: { access: ['admin'] }};
            var fakeblock = new Fakeblock({ acl: acl, userRole: 'user' });
            var actual = fakeblock.canUserAccessMethod('find');
            actual.should.be.false;
        });

        it('should return true if the role is in the list', function () {
            var acl = { find: { access: ['user'] }};
            var fakeblock = new Fakeblock({ acl: acl, userRole: 'user' });
            var actual = fakeblock.canUserAccessMethod('find');
            actual.should.be.true;
        });
    });

    describe('applyAcl()', function () {
        it('should throw an error if data is missing', function () {
            var fakeblock = new Fakeblock();
            var fn = function () {
                fakeblock.applyAcl();
            };
            taste.expect(fn).to.throw(/Fakeblock missing required input/);
        });

        it('should return the default fields if data does not exist', function () {
            var acl = { find: { select: { 'default': { user: ['one', 'two'] }}}};
            var fakeblock = new Fakeblock({ acl: acl, name: 'test', userId: 123, userRole: 'user' });
            var expected = ['one', 'two'];
            var actual = fakeblock.applyAcl(null, 'find', 'select');
            taste.expect(actual).to.exist;
            actual.should.deep.equal(expected);
        });

        it('should automatically add condition if isMine', function () {
            var acl = { find: { select: { onlyMine: { roles: ['user'], field: 'someField' }}}};
            var userId = 123;
            var fakeblock = new Fakeblock({ acl: acl, name: 'test', userId: userId, userRole: 'user' });
            var expected = { someField: userId };
            var actual = fakeblock.applyAcl(null, 'find', 'select');
            taste.expect(actual).to.exist;
            actual.should.deep.equal(expected);
        });

        it('should throw error if onlyMine and no userId', function () {
            var acl = { find: { select: { onlyMine: { roles: ['user'], field: 'someField' }}}};
            var fakeblock = new Fakeblock({ acl: acl, name: 'test', userRole: 'user' });
            var fn = function () {
                fakeblock.applyAcl(null, 'find', 'select');
            };
            taste.expect(fn).to.throw(/onlyMine requires userId/);
        });

        it('should throw error if block with user role restricted fields', function () {
            var acl = { find: { select: { restricted: { user: ['something'] }}}};
            var fakeblock = new Fakeblock({ acl: acl, name: 'test', userId: 123, userRole: 'user' });
            var data = { something: 'one', another: 'two' };
            var fn = function () {
                fakeblock.applyAcl(data, 'find', 'select');
            };
            taste.expect(fn).to.throw(/Fakeblock blocked some data/);
        });

        it('should throw error if block with allroles restricted fields', function () {
            var acl = { find: { select: { restricted: { allroles: ['something'] }}}};
            var fakeblock = new Fakeblock({ acl: acl, name: 'test', userId: 123, userRole: 'user' });
            var data = { something: 'one', another: 'two' };
            var fn = function () {
                fakeblock.applyAcl(data, 'find', 'select');
            };
            taste.expect(fn).to.throw(/Fakeblock blocked some data/);
        });

        it('should throw error if block with user role allowed fields', function () {
            var acl = { find: { select: { allowed: { user: ['another'] }}}};
            var fakeblock = new Fakeblock({ acl: acl, name: 'test', userId: 123, userRole: 'user' });
            var data = { something: 'one', another: 'two' };
            var fn = function () {
                fakeblock.applyAcl(data, 'find', 'select');
            };
            taste.expect(fn).to.throw(/Fakeblock blocked some data/);
        });

        it('should throw error if block with allroles role allowed fields', function () {
            var acl = { find: { select: { allowed: { allroles: ['another'] }}}};
            var fakeblock = new Fakeblock({ acl: acl, name: 'test', userId: 123, userRole: 'user' });
            var data = { something: 'one', another: 'two' };
            var fn = function () {
                fakeblock.applyAcl(data, 'find', 'select');
            };
            taste.expect(fn).to.throw(/Fakeblock blocked some data/);
        });
    });

    describe('checkValues()', function () {
        it('should return data if no data passed in', function () {
            var acl = { create: { values: { restricted: { user: { type: ['question', 'answer'] }}}}};
            var fakeblock = new Fakeblock({ acl: acl, name: 'test', userId: 123, userRole: 'user' });
            var data = null;
            var fn = function () {
                fakeblock.checkValues(data, 'create');
            };
            taste.expect(fn).to.not.throw(Error);
        });

        it('should not throw an error if no restricted violation', function () {
            var acl = { create: { values: { restricted: { user: { type: ['question', 'answer'] }}}}};
            var fakeblock = new Fakeblock({ acl: acl, name: 'test', userId: 123, userRole: 'user' });
            var data = { type: 'blah' };
            var fn = function () {
                fakeblock.checkValues(data, 'create');
            };
            taste.expect(fn).to.not.throw(Error);
        });

        it('should throw an error if a restricted violation', function () {
            var acl = { create: { values: { restricted: { user: { type: ['question', 'answer'] }}}}};
            var fakeblock = new Fakeblock({ acl: acl, name: 'test', userId: 123, userRole: 'user' });
            var data = { type: 'question' };
            var fn = function () {
                fakeblock.checkValues(data, 'create');
            };
            taste.expect(fn).to.throw(/not valid for test create/);
        });

        it('should throw an error if no allowed field', function () {
            var acl = { create: { values: { allowed: { user: { type: ['question', 'answer'] }}}}};
            var fakeblock = new Fakeblock({ acl: acl, name: 'test', userId: 123, userRole: 'user' });
            var data = { type: 'blah' };
            var fn = function () {
                fakeblock.checkValues(data, 'create');
            };
            taste.expect(fn).to.throw(/Value blah not valid/);
        });

        it('should not throw an error if allowed field', function () {
            var acl = { create: { values: { allowed: { user: { type: ['question', 'answer'] }}}}};
            var fakeblock = new Fakeblock({ acl: acl, name: 'test', userId: 123, userRole: 'user' });
            var data = { type: 'question' };
            var fn = function () {
                fakeblock.checkValues(data, 'create');
            };
            taste.expect(fn).to.not.throw(Error);
        });
    });
});

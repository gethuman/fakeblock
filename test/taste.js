/**
 * Author: Jeff Whelpley
 * Date: 2/25/14
 *
 * All testing dependencies
 */
var sinon           = require('sinon');
var chai            = require('chai');
var sinonChai       = require('sinon-chai');

chai.use(sinonChai);

var target = function (relativePath) {
    return require('../lib/' + relativePath);
};

module.exports = {
    target: target,

    spy:    sinon.spy,
    expect: chai.expect,
    should: chai.should()
};


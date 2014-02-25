/**
 * Copyright 2013 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 8/18/13
 *
 * This module works off of a acl file that has all
 * the security aclurations for CRUD operations on
 * a given collection
 */
var lodash  = require('lodash');
var Differ  = require('differ');
var differ  = new Differ();
var fieldFilter = require('./field.filter');

/**
 * Set the values for Fakeblock on a per ACL and per user basis
 * @param opts
 * @constructor
 */
var Fakeblock = function (opts) {
    opts = opts || {};
    this.name = opts.name || 'unknown';
    this.userId = opts.userId || null;
    this.userRole = opts.userRole || 'anonymous';
    this.acl = opts.acl || {};
};

/**
 * Get a value from a specific acl
 * @param key
 * @returns {*}
 */
Fakeblock.prototype.getValue = function (key) {
    key = key || '';

    var keyParts = key.split('.');
    var pointer = this.acl;

    for (var i = 0; i < keyParts.length; i++) {
        if (pointer[keyParts[i]]) {
            pointer = pointer[keyParts[i]];
        }
        else {
            return undefined;
        }
    }

    return pointer;
};


/**
 * Check to see if a user has access to a method (i.e. create/find/update/remove)
 *
 * @param methodName
 * @returns {boolean}
 */
Fakeblock.prototype.canUserAccessMethod = function (methodName) {
    var accessList = this.getValue(methodName + '.access') || [];
    return accessList.indexOf(this.userRole) >= 0;
};

/**
 * Check to see if a user is restricted by
 * @param data
 * @param methodName
 */
Fakeblock.prototype.checkValues = function (data, methodName) {
    var role = this.userRole;
    var name = this.name;
    var prefix = methodName + '.values.';
    var restrictedFields    = this.getValue(prefix + 'restricted.' + role);
    var allowedFields       = this.getValue(prefix + 'allowed.' + role);

    if (!data) {
        return;
    }

    // if no restrictions/allowed with the given role, then look for the allroles
    if (!restrictedFields) {
        restrictedFields = this.getValue(prefix + 'restricted.allroles');
    }

    if (!allowedFields) {
        allowedFields = this.getValue(prefix + 'allowed.allroles');
    }

    if (restrictedFields) {
        lodash.each(restrictedFields, function (restrictedValues, key) {
            if (data[key] && restrictedValues.indexOf(data[key]) >= 0) {
                throw new Error('Value [' + data[key] + '] not valid for ' + name + ' ' +
                    methodName + ' with role ' + role);
            }
        });
    }
    else if (allowedFields) {
        lodash.each(allowedFields, function (validValues, key) {
            if (data[key] && validValues.indexOf(data[key]) < 0) {
                throw new Error('Value ' + data[key] + ' not valid. Must be ' +
                    JSON.stringify(validValues) + ' for role ' + role);
            }
        });
    }
};

/**
 * This is the primary function for filtering data. If the user supplies data that
 * conflicts with the ACL, an error is throw. If no data is given and there is
 * a default in the ACL, the default is used.
 *
 * @param data The data that will be filtered
 * @param methodName [create|find|update|remove]
 * @param dataType [fields|select|where|sort] Default is 'fields'
 * @returns {{}} The filtered data is returned
 */
Fakeblock.prototype.applyAcl = function (data, methodName, dataType) {
    data = data || {};
    dataType = dataType || 'fields';

    if (!this.acl || !this.userRole || !methodName) {
        throw new Error('Fakeblock missing required input: role=' + this.userRole + ' method=' + methodName);
    }

    var prefix = methodName + '.' + dataType + '.';
    var onlyMineRoles       = this.getValue(prefix + 'onlyMine.roles') || [];
    var onlyMineField       = this.getValue(prefix + 'onlyMine.field') || 'createUserId';
    var defaultFields       = this.getValue(prefix + 'default.' + this.userRole);
    var defaultFieldsAll    = this.getValue(prefix + 'default.allroles');
    var restrictedFields    = this.getValue(prefix + 'restricted.' + this.userRole);
    var allowedFields       = this.getValue(prefix + 'allowed.' + this.userRole);

    // if the dataType is onlyMine, then we need to make sure the restriction is there
    if (onlyMineRoles.indexOf(this.userRole) >= 0) {
        if (!this.userId) {
            throw new Error('onlyMine requires userId set in Fakeblock constructor');
        }
        else {
            data[onlyMineField] = this.userId;
        }
    }

    // if there is no data, return one of the defaults
    if (!data || (lodash.isObject(data) && lodash.isEmpty(data))) {
        return defaultFields || defaultFieldsAll || data;
    }

    // if no restrictions/allowed with the given role, then look for the allroles
    if (!lodash.isArray(restrictedFields)) {
        restrictedFields = this.getValue(prefix + 'restricted.allroles');
    }

    if (!lodash.isArray(allowedFields)) {
        allowedFields = this.getValue(prefix + 'allowed.allroles');
    }

    // create a copy of the data object before we start messing with it
    var dataCopy = JSON.parse(JSON.stringify(data));
    data = fieldFilter.applyFilter(data, restrictedFields, allowedFields);

    // if anything changed, we will throw an error (perhaps make it optional to fail?)
    var diff = differ.calcDiff(data, dataCopy);
    if (diff) {
        throw new Error('Fakeblock blocked some data: name=' + this.name +
            ' userId=' + this.userId + ' role=' + this.userRole + ' method=' + methodName +
            ' dataType=' + dataType + ' diff=' + JSON.stringify(diff));
    }

    // else if we get here, we are all good
    return data;
};

Fakeblock.prototype.protect = function (opts) {
    opts = opts || {};
    var methodName = opts.method || 'default';

    if (!this.canUserAccessMethod(methodName)) {
        throw new Error('User does not have access to ' + this.name + ' ' + methodName);
    }

    this.checkValues(opts.data, methodName);

    this.applyAcl(opts.data, methodName, 'fields');
    this.applyAcl(opts.where, methodName, 'where');
    this.applyAcl(opts.select, methodName, 'select');
    this.applyAcl(opts.sort, methodName, 'sort');
};

module.exports = Fakeblock;


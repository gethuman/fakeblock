/**
 * Copyright 2013 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 8/18/13
 *
 * This module works off of a acl file that has all
 * the security aclurations for CRUD operations on
 * a given collection
 */
var _  = require('lodash');
var fieldFilter = require('./field.filter');

/**
 * Set the values for Fakeblock on a per ACL and per user basis
 * @param opts
 * @constructor
 */
var Fakeblock = function (opts) {
    opts = opts || {};
    this.name = opts.name || 'unknown';
    this.userId = opts.userId;
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
        _.each(restrictedFields, function (restrictedValues, key) {
            if (data[key] && restrictedValues.indexOf(data[key]) >= 0) {
                throw new Error('Value [' + data[key] + '] not valid for ' + name + ' ' +
                    methodName + ' with role ' + role);
            }
        });
    }
    else if (allowedFields) {
        _.each(allowedFields, function (validValues, key) {
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
    if (!data || (_.isObject(data) && _.isEmpty(data))) {
        return defaultFields || defaultFieldsAll || data;
    }

    // if no restrictions/allowed with the given role, then look for the allroles
    if (!_.isArray(restrictedFields)) {
        restrictedFields = this.getValue(prefix + 'restricted.allroles');
    }

    if (!_.isArray(allowedFields)) {
        allowedFields = this.getValue(prefix + 'allowed.allroles');
    }

    // create a copy of the data object before we start messing with it
    var dataCopy = JSON.parse(JSON.stringify(data));
    data = JSON.parse(JSON.stringify(data));
    data = fieldFilter.applyFilter(data, restrictedFields, allowedFields);

    // if the data is not equal, then something was filtered out, so error
    if (!_.isEqual(data, dataCopy)) {
        throw new Error('Fakeblock blocked some data for name=' + this.name +
            ' userId=' + this.userId + ' role=' + this.userRole + ' method=' + methodName +
            ' dataType=' + dataType + ' original=' + JSON.stringify(dataCopy) +
            ' filtered=' + JSON.stringify(data));
    }

    // else if we get here, we are all good
    return data;
};

module.exports = Fakeblock;


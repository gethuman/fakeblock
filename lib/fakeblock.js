/**
 * Copyright 2013 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 8/18/13
 *
 * This module works off of a config file that has all
 * the security configurations for CRUD operations on
 * a given collection
 */
var lodash  = require('lodash');
var Differ  = require('differ');
var differ  = new Differ();
var fieldFilter = require('./field.filter');

/**
 * Get a value from a specific config
 * @param key
 * @param config
 * @returns {*}
 */
var getValue = function (config, key) {
    if (!key || !config) {
        return undefined;
    }

    var keyParts = key.split('.');
    var pointer = config;

    for(var i = 0; i < keyParts.length; i++) {
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
 * @param config
 * @param role
 * @param methodName
 * @returns {boolean}
 */
var canUserAccessMethod = function (config, role, methodName) {
    var accessList = getValue(config, methodName + '.access') || [];
    return accessList.indexOf(role) >= 0;
};

/**
 * This is the primary function for filtering data. If the user supplies data that
 * conflicts with the ACL, an error is throw. If no data is given and there is
 * a default in the ACL, the default is used.
 *
 * @param name The name of the resource that is being filtered (only used for debugging)
 * @param config The actual acl config object
 * @param userId ID of the user that wants access
 * @param userRole Role of the user that wants access
 * @param methodName [create|find|update|remove]
 * @param dataType [fields|select|where|sort]
 * @param data The data that will be filtered
 * @returns {{}} The filtered data is returned
 */
var applyAcl = function (name, config, userId, userRole, methodName, dataType, data) {
    name = name || 'unknown';
    data = data || {};

    if (!config || !userId || !userRole || !methodName || !dataType) {
        throw new Error('Fakeblock missing required input: name=' + name +
            ' userId=' + userId + ' role=' + userRole + ' method=' + methodName +
            ' dataType=' + dataType);
    }

    var prefix = methodName + '.' + dataType + '.';
    var onlyMineRoles       = this.getValue(config, prefix + 'onlyMine.roles') || [];
    var onlyMineField       = this.getValue(config, prefix + 'onlyMine.field') || 'createUserId';
    var defaultFields       = this.getValue(config, prefix + 'default.' + userRole);
    var defaultFieldsAll    = this.getValue(config, prefix + 'default.allroles');
    var restrictedFields    = this.getValue(config, prefix + 'restricted.' + userRole);
    var allowedFields       = this.getValue(config, prefix + 'allowed.' + userRole);

    // if the dataType is onlyMine, then we need to make sure the restriction is there
    if (onlyMineRoles.indexOf(userRole) >= 0) {
        data[onlyMineField] = userId;
    }

    // if there is no data, return one of the defaults
    if (!data || (lodash.isObject(data) && lodash.isEmpty(data))) {
        return defaultFields || defaultFieldsAll || data;
    }

    // if no restrictions/allowed with the given role, then look for the allroles
    if (!lodash.isArray(restrictedFields)) {
        restrictedFields = this.getValue(config, prefix + 'restricted.allroles');
    }

    if (!lodash.isArray(allowedFields)) {
        allowedFields = this.getValue(config, prefix + 'allowed.allroles');
    }

    // create a copy of the data object before we start messing with it
    var dataCopy = JSON.parse(JSON.stringify(data));
    data = fieldFilter.applyFilter(data, restrictedFields, allowedFields);

    // if anything changed, we will throw an error (perhaps make it optional to fail?)
    var diff = differ.calcDiff(data, dataCopy);
    if (diff) {
        throw new Error('Fakeblock blocked some data: name=' + name +
            ' userId=' + userId + ' role=' + userRole + ' method=' + methodName +
            ' dataType=' + dataType + ' diff=' + JSON.stringify(diff));
    }

    // else if we get here, we are all good
    return data;
};

module.exports = {
    getValue: getValue,
    canUserAccessMethod: canUserAccessMethod,
    applyAcl: applyAcl
};


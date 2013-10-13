/**
 * Copyright 2013 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 8/18/13
 *
 * This module works off of a config file that has all
 * the security configurations for CRUD operations on
 * a given collection
 */
var _               = require('lodash');
var Differ          = require('differ');
var differ          = new Differ();
var objectFilter    = require('./field.object.filter.js');
var listFilter      = require('./field.list.filter.js');

/**
 * The constructor for the crud configurator
 * @param name
 * @param config A JSON file in the crud configuration format
 * @param options
 * @constructor
 */
var Fakeblock = function (name, config, options) {
    this.name = name;
    this.config = config;
    this.commonRestricted = [];

    options = options || {};
    this.baselineAcl = options.baselineAcl;
};

/**
 * Set an array of fields that will always be restricted for any user during update/create
 * @param fields
 */
Fakeblock.prototype.setCommonRestrictedUpdateFields = function (fields) {
    this.commonRestricted = fields;
};

/**
 * Get the access list for a given http method
 * @param httpMethod
 * @returns {*}
 */
Fakeblock.prototype.getAccessList = function (httpMethod) {
    var crudOperation;
    switch (httpMethod) {
        case 'get': crudOperation = 'retrieve'; break;
        case 'post': crudOperation = 'create'; break;
        case 'put': crudOperation = 'update'; break;
        case 'del': crudOperation = 'del'; break;
    }

    return this.getValue(crudOperation + '.access');
};

/**
 * Given a dot notated key, get a value from an object. For
 * example, if create.restricted.admin was the key, then the value
 * would come from create: { restricted: { admin: val } }
 * @param key
 */
Fakeblock.prototype.getValue = function (key) {
    return this.getValueFromConfig(key, this.config);
};

/**
 * Get a value from a specific config
 * @param key
 * @param config
 * @returns {*}
 */
Fakeblock.prototype.getValueFromConfig = function (key, config) {
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
 * Filter a set of fields based on the caller role
 * @param data
 * @param role
 */
Fakeblock.prototype.filterCreateFields = function (data, role) {
    var restrictedFields    = this.getValue('create.restricted.' + role);
    var allowedFields       = this.getValue('create.allowed.' + role);

    // if restricted fields exist, combine with the common set of restricted fields
    if (restrictedFields) {
        var allRestricted = restrictedFields.concat(this.commonRestricted);
        data = objectFilter.removeFields(data, allRestricted);
    }
    // else if we have a list of allowed fields use those
    else if (allowedFields) {
        data = objectFilter.getFields(data, allowedFields);
    }
    // else role has to be on fullAccess list; otherwise, we don't know how to handle the role
    else if (!this.roleHasAccess('create', role)) {
        throw new Error('Role ' + role + ' does not have create access to ' + this.name);
    }

    // remove blocked fields unless
    data = this.blockFields('create', data, role);

    return data;
};

/**
 * If a field is in the block list and not explicitly allowed, then remove it
 * @param operation
 * @param data
 * @param role
 */
Fakeblock.prototype.blockFields = function (operation, data, role) {
    var blockedFields = this.getValueFromConfig(operation + '.blocked', this.baselineAcl);
    var noBlockFields = this.getValue(operation + '.noblock.' + role);

    _.each(data, function (value, key) {
        if (blockedFields && blockedFields.indexOf(key) >= 0 && (!noBlockFields || noBlockFields.indexOf(key) < 0)) {
            delete data[key];
        }
    });

    return data;
};

/**
 * Get the default select fields for a given role
 * @param role
 * @returns {string}
 */
Fakeblock.prototype.getDefaultSelectFields = function (role) {
    var defaultSelect = this.getValue('retrieve.select.default.' + role);

    if (defaultSelect) {
        return defaultSelect;
    }
    else {
        return '';
    }
};

/**
 * Filter
 * @param selectFields
 * @param role
 * @returns {string}
 */
Fakeblock.prototype.filterSelectFields = function (selectFields, role) {
    if (!selectFields) {
        return this.getDefaultSelectFields(role);
    }

    var restrictedFields    = this.getValue('retrieve.select.restricted.' + role);
    var allowedFields       = this.getValue('retrieve.select.allowed.' + role);
    var filteredFields;

    var selectList = selectFields.split(',');
    if (restrictedFields) {
        filteredFields = listFilter.removeItems(selectList, restrictedFields);
    }
    else if (allowedFields) {
        filteredFields = listFilter.getItems(selectList, allowedFields);
    }
    else if (this.roleHasAccess('retrieve', role)) {
        filteredFields = selectList;
    }
    else {
        throw new Error('Role ' + role + ' does not have select access to ' + this.name);
    }

    return filteredFields.join(' ');
};

Fakeblock.prototype.removeFilteredFields = function (obj, role) {
    var restrictedFields    = this.getValue('retrieve.select.restricted.' + role);
    var allowedFields       = this.getValue('retrieve.select.allowed.' + role);
    var filteredObject;

    if (restrictedFields) {
        filteredObject = objectFilter.removeFields(obj, restrictedFields);
    }
    else if (allowedFields) {
        filteredObject = objectFilter.getFields(obj, allowedFields);
    }
    else if (this.roleHasAccess('retrieve', role)) {
        filteredObject = obj;
    }
    else {
        throw new Error('Role ' + role + ' does not have access to get object for ' + this.name);
    }

    return filteredObject;
};

/**
 * Filter the select where conditions by the allowed values in the config
 * @param conditions
 * @returns {{}}
 */
Fakeblock.prototype.filterConditions = function (conditions) {
    var conditionFields = Object.keys(conditions);
    var allowedFields = this.getValue('retrieve.where.allowed');
    var filteredConditions = {};
    var i, key, fieldCount = 0;

    for (i = 0; i < allowedFields.length; i++) {
        key = allowedFields[i];
        if (conditions[key]) {
            filteredConditions[key] = conditions[key];
            fieldCount++;
        }
    }

    // we don't want to run query if user's criteria is not valid
    if (fieldCount !== conditionFields.length) {
        var diff = differ.calcDiff(conditions, filteredConditions);
        throw new Error('User does not have permission to use query criteria: ' + JSON.stringify(diff));
    }

    return filteredConditions;
};

/**
 * Check to see if a given set of conditions are valid
 * @param conditions
 * @returns {boolean}
 */
Fakeblock.prototype.conditionsAreValid = function (conditions) {
    var allowedFields = this.getValue('retrieve.where.allowed');

    // if conditions or allowed fields don't exist, then we are fine
    if (!conditions || !allowedFields) {
        return true;
    }

    // if a value exists in conditions list but NOT in allowed, then invalid
    for(var key in conditions) {
        if (conditions.hasOwnProperty(key) && allowedFields.indexOf(key) < 0) {
            return false;
        }
    }

    return true;
};

/**
 * If conditions exist, they must all match ones that are valid for the user. If conditions
 * don't exist, the user role must be in the list of roles that can getAll.
 * @param conditions
 * @param role
 */
Fakeblock.prototype.conditionsAreValidForSelect = function (conditions, role) {
    var rolesThatCanGetAll = this.getValue('retrieve.where.getAll');
    var conditionsExistAndAreValid = !_.isEmpty(conditions) && this.conditionsAreValid(conditions);
    var conditionsNotExistButRoleGetAll = _.isEmpty(conditions) && rolesThatCanGetAll.indexOf(role) >= 0;

    return conditionsExistAndAreValid || conditionsNotExistButRoleGetAll;
};

/**
 * Check to see if the role can only select themselves
 * @param role
 * @returns {*|boolean}
 */
Fakeblock.prototype.onlyGetMyStuff = function (role) {
    var onlySelectSelfList = this.getValue('retrieve.onlyMine');
    return onlySelectSelfList && onlySelectSelfList.indexOf(role) >= 0;
};

/**
 * Check to see if the role can only delete themselves
 * @param role
 * @returns {*|boolean}
 */
Fakeblock.prototype.onlyDeleteMyStuff = function (role) {
    var onlyDeleteSelfList = this.getValue('del.onlyMine');
    return onlyDeleteSelfList && onlyDeleteSelfList.indexOf(role) >= 0;
};

/**
 * If the input sort value is valid, use it
 * @param sortParam
 * @returns {*}
 */
Fakeblock.prototype.validateSortElseUseDefault = function (sortParam) {

    // if false, then it means caller doesn't want any sorting
    if (sortParam === false) {
        return undefined;
    }

    // if doesn't exist, add default sort
    if (!sortParam) {
        return this.getValue('retrieve.sort.default');
    }

    // else we have a sort fields, so try to validate it
    var allowedSortFields   = this.getValue('retrieve.sort.allowed');
    var sortField           = sortParam || '';
    var sortFields          = sortField.split(',');
    var me                  = this;

    _.each(sortFields, function (field) {
        if (field.substring(0, 1) === '-') {
            field = sortField.substring(1);
        }

        // if the field is not allowed, throw exception
        if (allowedSortFields.indexOf(field) < 0) {
            throw new Error('Invalid sort field ' + field + ' for acl ' + me.name);
        }
    });

    return sortParam;
};

/**
 * Check to see if the role can only update themselves
 * @param role
 * @returns {*|boolean}
 */
Fakeblock.prototype.onlyUpdateMyStuff = function (role) {
    var onlyUpdateSelfList = this.getValue('update.onlyMine');
    return onlyUpdateSelfList && onlyUpdateSelfList.indexOf(role) >= 0;
};

/**
 * Filter a set of fields for updating with the list from the crud config
 * @param data
 * @param role
 * @returns {*}
 */
Fakeblock.prototype.filterUpdateFields = function (data, role) {
    var restrictedFields    = this.getValue('update.restricted.' + role);
    var allowedFields       = this.getValue('update.allowed.' + role);

    // if restricted fields exist, combine with the common set of restricted fields
    if (restrictedFields) {
        var allRestricted = restrictedFields.concat(this.commonRestricted);
        data = objectFilter.removeFields(data, allRestricted);
    }
    // else if we have a list of allowed fields use those
    else if (allowedFields) {
        data = objectFilter.getFields(data, allowedFields);
    }
    // else role has to be on fullAccess list; otherwise, we don't know how to handle the role
    else if (!this.roleHasAccess('update', role)) {
        throw new Error('Role ' + role + ' does not have update access to ' + this.name);
    }

    // remove blocked fields unless
    data = this.blockFields('update', data, role);

    return data;
};

/**
 * Check to see if a role has access to a given CRUD operation
 * @param operation
 * @param role
 * @returns {boolean}
 */
Fakeblock.prototype.roleHasAccess = function  (operation, role) {
    var accessList = this.getValue(operation + '.access');
    return (accessList && accessList.indexOf(role) >= 0);
};

module.exports = Fakeblock;

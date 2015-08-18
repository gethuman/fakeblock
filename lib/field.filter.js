/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 2/17/14
 *
 * A few data manipulation utility functions used by fakeblock to apply
 * filters (both restrictive and permissive) on data given a list of fields
 */
var _ = require('lodash');

/**
 * Remove items from a list
 * @param list
 * @param itemsToRemove
 * @returns {Array}
 */
var removeItemsFromList = function (list, itemsToRemove) {
    var result = [];

    _.each(list, function (item) {
        var valid = true;
        for (var i = 0; i < itemsToRemove.length; i++) {

            // if the item match one of the items to remove don't includ it in the result list
            if (item.indexOf(itemsToRemove[i]) === 0) {
                valid = false;
                break;
            }
        }

        if (valid) {
            result.push(item);
        }
    });

    return result;
};

/**
 * Get all items from a list that match specified items.
 * @param list
 * @param itemsToGet
 * @returns {Array}
 */
var getItemsFromList = function (list, itemsToGet) {
    var result = [];

    _.each(list, function (item) {
        for (var i = 0; i < itemsToGet.length; i++) {
            if (item.indexOf(itemsToGet[i]) === 0) {
                result.push(item);
            }
        }
    });

    return result;
};

/**
 * Remove all specified fields from a given object based on input
 * of field paths. The field path must match a object field to
 * be removed.
 * @param data Data to be changed
 * @param fieldsToRemove An array of field paths
 * @returns {{}}
 */
var removeFieldsFromObj = function (data, fieldsToRemove) {
    _.each(fieldsToRemove, function (fieldToRemove) {

        // if field to remove is in the data, just remove it and go to the next one
        if (data[fieldToRemove]) {
            delete data[fieldToRemove];
            return true;
        }

        var fieldParts = fieldToRemove.split('.');
        var fieldPart;
        var dataPointer = data;
        var len = fieldParts.length;
        for (var i = 0; i < len; i++) {
            fieldPart = fieldParts[i];

            // if the field doesn't exist, break out of the loop
            if (!dataPointer[fieldPart]) {
                break;
            }
            // if we are at the end then delete the item from the updatedData
            else if (i === (len - 1)) {
                delete dataPointer[fieldPart];
            }
            // else move the pointer down the object tree and go to the next iteration
            else {
                dataPointer = dataPointer[fieldPart];
            }
        }

        return true;
    });

    return data;
};

/**
 * Get all fields specified from an object
 * @param data
 * @param fieldsToGet An array of fields where each field is dot notation
 * @returns {{}}
 */
var getFieldsFromObj = function (data, fieldsToGet) {
    var newObj = {};
    _.each(fieldsToGet, function (fieldToGet) {

        // if the field to get is in the data, then just transfer it over and that is it
        if (data.hasOwnProperty(fieldToGet)) {
            newObj[fieldToGet] = data[fieldToGet];
            return true;
        }

        var fieldParts = fieldToGet.split('.');
        var len = fieldParts.length;
        var dataPointer = data;
        var tempPointer = newObj;
        var fieldPart, i;

        for (i = 0; i < len; i++) {
            fieldPart = fieldParts[i];

            // if doesn't exist, then break out of loop as there is no value in data for this
            if (typeof dataPointer[fieldPart] === 'undefined') {
                break;
            }
            // else we are at the end, so copy this value to the newObj
            else if (i === (len - 1)) {
                tempPointer[fieldPart] = dataPointer[fieldPart];
            }
            else {
                dataPointer = dataPointer[fieldPart];
                tempPointer = tempPointer[fieldPart] = tempPointer[fieldPart] || {};
            }
        }

        return true;
    });

    return newObj;
};

/**
 * Apply the appropriate filter based on the input data
 *
 * @param data
 * @param restrictedFields
 * @param allowedFields
 * @returns {{}}
 */
var applyFilter = function (data, restrictedFields, allowedFields) {
    var filterFunc;

    // if string, something like a sort where each word should be a value
    var isString = _.isString(data);
    if (isString) { data = data.split(' '); }

    if (restrictedFields) {
        filterFunc = _.isArray(data) ? removeItemsFromList : removeFieldsFromObj;
        data = filterFunc(data, restrictedFields);
    }
    else if (allowedFields) {
        filterFunc = _.isArray(data) ? getItemsFromList : getFieldsFromObj;
        data = filterFunc(data, allowedFields);
    }

    return isString ? data[0] : data;
};

module.exports = {
    removeItemsFromList: removeItemsFromList,
    getItemsFromList: getItemsFromList,
    removeFieldsFromObj: removeFieldsFromObj,
    getFieldsFromObj: getFieldsFromObj,
    applyFilter: applyFilter
};
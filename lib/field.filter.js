/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 2/17/14
 *
 * A few data manipulation utility functions used by fakeblock to apply
 * filters (both restrictive and permissive) on data given a list of fields
 */
var lodash = require('lodash');

/**
 * Remove items from a list
 * @param list
 * @param itemsToRemove
 * @returns {Array}
 */
var removeItemsFromList = function (list, itemsToRemove) {
    var result = [];

    lodash.each(list, function (item) {
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

    lodash.each(list, function (item) {
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
    lodash.each(fieldsToRemove, function (fieldToRemove) {
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
    });

    return data;
};

/**
 * Get all fields specified from an object
 * @param data
 * @param fieldsToGet
 * @returns {{}}
 */
var getFieldsFromObj = function (data, fieldsToGet) {
    var newObj = {};
    lodash.each(fieldsToGet, function (fieldToGet) {
        var fieldParts = fieldToGet.split('.');
        var len = fieldParts.length;
        var dataPointer = data;
        var tempObj = {};
        var tempPointer = tempObj;
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
                newObj[fieldParts[0]] = tempObj[fieldParts[0]];
            }
            else {
                dataPointer = dataPointer[fieldPart];
                tempPointer = tempPointer[fieldPart] = {};
            }
        }
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
    if (restrictedFields) {
        filterFunc = lodash.isArray(data) ? removeItemsFromList : removeFieldsFromObj;
        data = filterFunc(data, restrictedFields);
    }
    else if (allowedFields) {
        filterFunc = lodash.isArray(data) ? getItemsFromList : getFieldsFromObj;
        data = filterFunc(data, allowedFields);
    }

    return data;
};

module.exports = {
    removeItemsFromList: removeItemsFromList,
    getItemsFromList: getItemsFromList,
    removeFieldsFromObj: removeFieldsFromObj,
    getFieldsFromObj: getFieldsFromObj,
    applyFilter: applyFilter
};
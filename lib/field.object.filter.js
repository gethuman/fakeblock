/**
 * Copyright 2013 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 8/18/13
 *
 * Utility code for filtering an object in various ways
 */
var _ = require('lodash');

module.exports = exports = {

    /**
     * Remove all specified fields from a given object
     * @param data
     * @param fieldsToRemove
     * @returns {{}}
     */
    removeFields: function (data, fieldsToRemove) {
        _.each(fieldsToRemove, function (fieldToRemove) {
            var fieldParts = fieldToRemove.split('.');
            var fieldPart;
            var dataPointer = data;
            var len = fieldParts.length;
            for(var i = 0; i < len; i++) {
                fieldPart = fieldParts[i];

                // if the field doesn't exist, break out of the loop
                if(!dataPointer[fieldPart]) {
                    break;
                }
                // if we are at the end then delete the item from the updatedData
                else if(i === (len - 1)) {
                    delete dataPointer[fieldPart];
                }
                // else move the pointer down the object tree and go to the next iteration
                else {
                    dataPointer = dataPointer[fieldPart];
                }
            }
        });

        return data;
    },

    /**
     * Get all fields specified from an object
     * @param data
     * @param fieldsToGet
     * @returns {{}}
     */
    getFields: function (data, fieldsToGet) {
        var newObj = {};
        _.each(fieldsToGet, function(fieldToGet) {
            var fieldParts = fieldToGet.split('.');
            var fieldPart;
            var len = fieldParts.length;
            var dataPointer = data;
            var fieldObj = {};
            var tempObj = fieldObj;

            for(var i = 0; i < len; i++) {
                fieldPart = fieldParts[i];

                // if doesn't exist, then break out of loop as there is no value in data for this
                if(!dataPointer[fieldPart]) {
                    break;
                }
                // else we are at the end, so copy this value to the newObj
                else if(i === (len - 1)) {
                    tempObj[fieldPart] = dataPointer[fieldPart];
                    newObj[fieldParts[0]] = fieldObj[fieldParts[0]];
                }
                else {
                    dataPointer = dataPointer[fieldPart];
                    tempObj[fieldPart] = {};
                    tempObj = tempObj[fieldPart];
                }
            }
        });

        return newObj;
    }
};
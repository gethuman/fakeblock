/**
 * Copyright 2013 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 8/18/13
 *
 * Used by the base model to manipulate an array of fields with
 * either a restriction list (i.e. removeItems) or an allowed
 * list (i.e. getItems)
 */
var _ = require('lodash');

module.exports = {

    /**
     * Remove items from a list
     * @param list
     * @param itemsToRemove
     * @returns {Array}
     */
    removeItems: function (list, itemsToRemove) {
        var result = [];

        _.each(list, function(item) {
            var valid = true;
            for(var i = 0; i < itemsToRemove.length; i++) {

                // if the item match one of the items to remove don't includ it in the result list
                if(item.indexOf(itemsToRemove[i]) === 0) {
                    valid = false;
                    break;
                }
            }

            if(valid) {
                result.push(item);
            }
        });

        return result;
    },

    /**
     * Get all items from a list that match specified items.
     * @param list
     * @param itemsToGet
     * @returns {Array}
     */
    getItems: function (list, itemsToGet) {
        var result = [];

        _.each(list, function(item) {
            for(var i = 0; i < itemsToGet.length; i++) {
                if(item.indexOf(itemsToGet[i]) === 0) {
                    result.push(item);
                }
            }
        });

        return result;
    }
};
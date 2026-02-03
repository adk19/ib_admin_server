// ./src/helpers/pick.js

/* -------------------------------------------------------------------------- */
/*        Picks specified keys from an object and returns a new object        */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Picks specified keys from an object and returns a new object
 * @param {Object} obj - The source object.
 * @param {Array} keys - The keys to pick from the source object.
 * @returns {Object} A new object containing only the picked keys.
 */
const pick = (object, keys) => {
    return keys.reduce((obj, key) => {
        if (object && Object.prototype.hasOwnProperty.call(object, key)) {
            obj[key] = object[key];
        }
        return obj;
    }, {});
};


/* ------------------------------ EXPORT MODEL ------------------------------ */
module.exports = { pick };
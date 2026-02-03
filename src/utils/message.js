// ./src/utils/message.js

const { ObjectId } = require("mongoose").Types;

/* ------------------------ Validates Message Object ------------------------ */
exports.validMessage = {
    string: {
        base: `{{#label}} must be a string`,
        required: `{{#label}} is required`,
        empty: `{{#label}} cannot be empty`,
        trim: `{{#label}} must not have leading or trailing whitespace`,
        min: `{{#label}} must be at least {{#limit}} character`,
        max: `{{#label}} must be at most  {{#limit}} characters`,
        pattern: `{{#label}} with value {:[.]} fails to match the required pattern`
    },
    number: {
        base: `{{#label}} must be a number`,
        integer: `{{#label}} must be an integer`,
        min: `{{#label}} must be at least {{#limit}}`,
        max: `{{#label}} must be less than or equal to {{#limit}}`
    },
    boolean: {
        base: `{{#label}} must be a boolean`
    },
    any: {
        required: `{{#label}} is required`,
        only: `{{#label}} must be one of {{#valids}}`
    }
};


/* ----------------------- Validates MongoDB ObjectId ----------------------- */
exports.objectId = (value, helpers) => {
    if (!ObjectId.isValid(value)) return helpers.message(`"{{#label}}" must be a valid mongo id`);
    return value;
};


/* --------------------------- Validates Password --------------------------- */
exports.password = (value, helpers) => {
    // Check minimum length
    if (value.length < 8) return helpers.message("Password must be at least 8 characters");

    // Check required patterns: letter, number, special character
    const hasLetter = /[a-zA-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$&_\-?]/.test(value);

    // Collect missing parts dynamically
    const missing = [];
    if (!hasLetter) missing.push("one letter");
    if (!hasNumber) missing.push("one number");
    if (!hasSpecialChar) missing.push("one special character (!@#$&_-?)");

    // If any rule is missing, return dynamic message
    if (missing.length) return helpers.message(`Password must contain at least ${missing.join(", ")}`);

    return value;
};

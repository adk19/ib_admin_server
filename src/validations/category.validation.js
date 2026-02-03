// ./src/validations/category.validation.js

const Joi = require("joi");
const { validMessage, objectId } = require("../utils/message.js");

// Create Category Validation
exports.createCategory_validation = {
    body: Joi.object({
        name: Joi.string().trim().min(2).max(80).required().messages({
            "string.base": validMessage.string.base,
            "string.empty": validMessage.string.empty,
            "string.min": validMessage.string.min,
            "string.max": validMessage.string.max,
            "any.required": validMessage.any.required
        })
    })
};

// Pagelist Category Validation
exports.pagelistCategory_validation = {
    query: Joi.object({
        page: Joi.number().integer().min(1).max(100).required()
            .messages({
                "number.base": validMessage.number.base,
                "number.integer": validMessage.number.integer,
                "number.min": validMessage.number.min,
                "number.max": validMessage.number.max,
                "any.required": validMessage.any.required
            }),
        limit: Joi.number().integer().min(1).max(100).required()
            .messages({
                "number.base": validMessage.number.base,
                "number.integer": validMessage.number.integer,
                "number.min": validMessage.number.min,
                "number.max": validMessage.number.max,
                "any.required": validMessage.any.required
            }),
        search: Joi.string().trim().optional().allow(null, ""),
        sort: Joi.string().trim().valid("name", "active").optional().allow(""),
        order: Joi.number().valid(1, -1).optional().allow(null, "")
    })
};

// Update Category Status Validation
exports.statusCategory_validation = {
    query: Joi.object({
        _id: Joi.string().trim().required().custom(objectId).messages({
            "string.base": validMessage.string.base,
            "string.empty": validMessage.string.empty,
            "any.required": validMessage.any.required
        }),
        active: Joi.boolean().required().messages({
            "boolean.base": validMessage.boolean.base,
            "any.required": validMessage.any.required,
        })
    })
};

// Update Category Data Validation
exports.updateCategory_validation = {
    query: Joi.object({
        _id: Joi.string().trim().required().custom(objectId).messages({
            "string.base": validMessage.string.base,
            "string.empty": validMessage.string.empty,
            "any.required": validMessage.any.required
        })
    }),
    body: Joi.object({
        name: Joi.string().trim().min(2).max(80).required(),
        active: Joi.boolean().required()
    })
};

// Delete Category Validation
exports.deleteCategory_validation = {
    body: Joi.object({
        _ids: Joi.array().items(
            Joi.string().trim().required().custom(objectId).messages({
                "string.base": validMessage.string.base,
                "string.empty": validMessage.string.empty,
                "any.required": validMessage.any.required
            })
        ).required()
    })
};
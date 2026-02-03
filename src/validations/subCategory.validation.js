// ./src/validations/subCategory.validation.js

const Joi = require("joi");
const { validMessage, objectId } = require("../utils/message.js");

// Create Subcategory Validation
exports.createSubcategory_validation = {
    body: Joi.object({
        category: Joi.string().trim().required().custom(objectId).messages({
            "string.base": validMessage.string.base,
            "string.empty": validMessage.string.empty,
            "any.required": validMessage.any.required
        }),
        name: Joi.string().trim().min(2).max(80).required().messages({
            "string.base": validMessage.string.base,
            "string.empty": validMessage.string.empty,
            "string.min": validMessage.string.min,
            "string.max": validMessage.string.max,
            "any.required": validMessage.any.required
        }),
        description: Joi.string().trim().max(500).optional().allow(null, "").messages({
            "string.base": validMessage.string.base,
            "string.max": validMessage.string.max
        }),
        active: Joi.boolean().optional()
    })
};

// Pagelist Subcategory Validation
exports.pagelistSubcategory_validation = {
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
        search: Joi.string().trim().optional().allow(""),
        sort: Joi.string().trim().valid("category", "name", "active").optional().allow(""),
        order: Joi.number().valid(1, -1).optional().allow("")
    })
};

// List Subcategory by cat ID Validation
exports.listByCategoryId_validation = {
    param: Joi.object({
        _id: Joi.string().trim().required().custom(objectId).messages({
            "string.base": validMessage.string.base,
            "string.empty": validMessage.string.empty,
            "any.required": validMessage.any.required
        })
    }),
    query: Joi.object({
        search: Joi.string().trim().optional().allow("")
    })
}

// Update Subcategory Status Validation
exports.statusSubcategory_validation = {
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

// Update Subcategory Data Validation
exports.updateSubcategory_validation = {
    query: Joi.object({
        _id: Joi.string().trim().required().custom(objectId).messages({
            "string.base": validMessage.string.base,
            "string.empty": validMessage.string.empty,
            "any.required": validMessage.any.required
        })
    }),
    body: Joi.object({
        category: Joi.string().trim().required().custom(objectId).messages({
            "string.base": validMessage.string.base,
            "string.empty": validMessage.string.empty,
            "any.required": validMessage.any.required
        }),
        name: Joi.string().trim().min(2).max(80).required().messages({
            "string.base": validMessage.string.base,
            "string.empty": validMessage.string.empty,
            "string.min": validMessage.string.min,
            "string.max": validMessage.string.max,
            "any.required": validMessage.any.required
        }),
        description: Joi.string().trim().max(500).optional().allow(null, "").messages({
            "string.base": validMessage.string.base,
            "string.max": validMessage.string.max
        }),
        active: Joi.boolean().optional()
    })
};

// Delete Subcategory Validation
exports.deleteSubcategory_validation = {
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
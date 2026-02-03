// ./src/validations/user.validation.js

const Joi = require("joi");
const { validMessage, password, objectId } = require("../utils/message.js");

// Update me Validation
exports.updateMe_validation = {
    body: Joi.object({
        first_name: Joi.string().trim().min(1).max(50).messages({
            "string.base": validMessage.string.base,
            "string.empty": validMessage.string.empty,
            "string.min": validMessage.string.min,
            "string.max": validMessage.string.max
        }).optional(),
        last_name: Joi.string().trim().min(1).max(50).messages({
            "string.base": validMessage.string.base,
            "string.empty": validMessage.string.empty,
            "string.min": validMessage.string.min,
            "string.max": validMessage.string.max
        }).optional(),
        email: Joi.string().trim().email({ tlds: { allow: false } }).messages({
            "string.base": validMessage.string.base,
            "string.email": "{{#label}} must be a valid email"
        }).optional(),
        profile: Joi.object({
            avatar: Joi.string().trim().uri({ scheme: ["http", "https"] })
                .message("Avatar must be a valid URL (starting with http or https)")
                .optional(),
            phone: Joi.string().trim().pattern(/^[1-9]\d{7,14}$/)
                .message("Phone number must be a valid international number in E.164 format (e.g. 14155552671)")
                .optional(),
            address: Joi.object({
                city: Joi.string().trim().max(50),
                state: Joi.string().trim().max(50),
                country: Joi.string().trim().max(50),
                zip_code: Joi.string().trim().pattern(/^[A-Za-z0-9\- ]{3,10}$/).message("Zip code must be 3–10 characters and contain only letters, numbers, spaces, or hyphens")
            }).optional()
        }).optional()
    })
};

// Update Password Validation
exports.updatePassword_validation = {
    body: Joi.object({
        password: Joi.string().trim().required().custom(password, "Password Validation").messages({
            "string.base": validMessage.string.base,
            "string.empty": validMessage.string.empty,
            "any.required": validMessage.any.required
        }),
        newPassword: Joi.string().trim().required().custom(password, "Password Validation").messages({
            "string.base": validMessage.string.base,
            "string.empty": validMessage.string.empty,
            "any.required": validMessage.any.required
        }),
        newPasswordConfirm: Joi.any().valid(Joi.ref("newPassword")).required().messages({
            "any.only": "Password confirmation does not match password",
            "any.required": validMessage.any.required
        })
    })
};

// User Page list Validation
exports.userPagelist_validation = {
    query: Joi.object({
        page: Joi.number().integer().min(1).max(100).required().messages({
            "number.base": validMessage.number.base,
            "number.integer": validMessage.number.integer,
            "number.min": validMessage.number.min,
            "number.max": validMessage.number.max,
            "any.required": validMessage.any.required
        }),
        limit: Joi.number().integer().min(1).max(100).required().messages({
            "number.base": validMessage.number.base,
            "number.integer": validMessage.number.integer,
            "number.min": validMessage.number.min,
            "number.max": validMessage.number.max,
            "any.required": validMessage.any.required
        }),
        search: Joi.string().trim().optional().allow(null, ""),
        sort: Joi.string().trim().valid("first_name", "last_name", "email", "city", "state", "country", "zip_code", "active").optional().allow(null, ""),
        order: Joi.number().valid(1, -1).optional().allow(null, "")
    })
};

// User by Id Validation
exports.userId_validation = {
    query: Joi.object({
        _id: Joi.string().trim().required().custom(objectId).messages({
            "string.base": validMessage.string.base,
            "string.empty": validMessage.string.empty,
            "any.required": validMessage.any.required
        })
    })
};

// Update user status active Or Not
exports.userStatusUpdate_validation = {
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

// Delete user Validation
exports.userDelete_validation = {
    body: Joi.object({
        _ids: Joi.array().items(
            Joi.string().trim().required().custom(objectId).required().messages({
                "string.base": validMessage.string.base,
                "string.empty": validMessage.string.empty,
                "any.required": validMessage.any.required
            })
        ).required()
    })
};
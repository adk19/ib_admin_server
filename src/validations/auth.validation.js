// ./src/validations/auth.validation.js

const Joi = require("joi");
const { validMessage, password } = require("../utils/message.js");

// Register Joi Validation
exports.register_validation = {
    body: Joi.object({
        first_name: Joi.string().trim().max(50).required()
            .messages({
                "string.base": validMessage.string.base,
                "string.empty": validMessage.string.empty,
                "number.max": validMessage.number.max,
                "any.required": validMessage.any.required
            }),
        last_name: Joi.string().trim().optional().allow("").messages({
            "string.base": validMessage.string.base,
            "number.max": validMessage.number.max
        }),
        email: Joi.string().trim().email({ tlds: { allow: false } }).required()
            .messages({
                "string.base": validMessage.string.base,
                "string.email": "{{#label}} must be a valid email",
                "any.required": validMessage.any.required
            }),
        password: Joi.string().required()
            .custom(password, "Password Validation")
            .messages({
                "string.base": validMessage.string.base,
                "string.empty": validMessage.string.empty,
                "any.required": validMessage.any.required
            }),
        passwordConfirm: Joi.any().valid(Joi.ref("password")).required()
            .messages({
                "any.only": "Password confirmation does not match password",
                "any.required": validMessage.any.required
            })
    })
};

// Resent OTP validation
exports.sentOtp_validation = {
    query: Joi.object({
        email: Joi.string().trim().email({ tlds: { allow: false } }).required()
            .messages({
                "string.base": validMessage.string.base,
                "string.email": "{{#label}} must be a valid email",
                "any.required": validMessage.any.required
            }),
        type: Joi.string().trim().valid("login", "register").required()
            .messages({
                "string.base": validMessage.string.base,
                "any.required": validMessage.any.required
            })
    })
};

// Varified Email validation
exports.varifyOTP_validation = {
    body: Joi.object({
        type: Joi.string().trim().valid("login", "register").required()
            .messages({
                "string.base": validMessage.string.base,
                "any.required": validMessage.any.required
            }),
        email: Joi.string().trim().email({ tlds: { allow: true } }).required()
            .messages({
                "string.base": validMessage.string.base,
                "string.email": "{{#label}} must be a valid email",
                "any.required": validMessage.any.required
            }),
        otp: Joi.number().integer().min(100000).max(999999).required()
            .messages({
                "number.base": validMessage.number.base,
                "number.integer": validMessage.number.integer,
                "number.min": validMessage.number.min,
                "number.max": validMessage.number.max,
                "any.required": validMessage.any.required
            })
    })
};

// Login Joi Validation
exports.login_validation = {
    body: Joi.object({
        email: Joi.string().trim().email({ tlds: { allow: false } }).required()
            .messages({
                "string.base": validMessage.string.base,
                "string.email": "{{#label}} must be a valid email",
                "any.required": validMessage.any.required
            }),
        password: Joi.string().required()
            .custom(password, "Password Validation")
            .messages({
                "string.base": validMessage.string.base,
                "string.empty": validMessage.string.empty,
                "any.required": validMessage.any.required
            })
    })
};

// Forgot Password Validation
exports.forgot_validation = {
    query: Joi.object({
        email: Joi.string().trim().email({ tlds: { allow: false } }).required()
            .messages({
                "string.base": validMessage.string.base,
                "string.email": "{{#label}} must be a valid email",
                "any.required": validMessage.any.required
            })
    })
};

// Reset Password Validation
exports.reset_validation = {
    query: Joi.object({
        token: Joi.string().trim().required()
            .messages({
                "string.base": validMessage.string.base,
                "string.empty": validMessage.string.empty,
                "any.required": validMessage.any.required
            })
    }),
    body: Joi.object({
        password: Joi.string().required()
            .custom(password, "Password Validation")
            .messages({
                "string.base": validMessage.string.base,
                "string.empty": validMessage.string.empty,
                "any.required": validMessage.any.required
            }),
        passwordConfirm: Joi.any().valid(Joi.ref("password")).required()
            .messages({
                "any.only": "New password confirmation does not match new password",
                "any.required": validMessage.any.required
            })
    })
};

// Token Verify Validation
exports.tokenVerify_validation = {
    query: Joi.object({
        token: Joi.string().trim().required().messages({
            "string.base": validMessage.string.base,
            "string.empty": validMessage.string.empty,
            "any.required": validMessage.any.required
        })
    })
}
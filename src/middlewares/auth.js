// ./src/middlewares/auth.js

const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");
const { promisify } = require("util");
const { config } = require("../configs/envConfig.js");
const { setupLogger, logger, logRequestDetails } = require("../helpers/logger.js");
const { unauthorized, forbidden, serverError, success } = require("../utils/responses.js");

const verifyJwt = promisify(jwt.verify);

/* ----------------------------- Sign JWT token ----------------------------- */
exports.createToken = (data) => {
    return jwt.sign(data, config.jwt.secret, { expiresIn: config.jwt.expires || "1d" });
};


/* ---------------------- Middleware to protect routes ---------------------- */
exports.protect = async (req, res, next) => {
    setupLogger("authentication");
    try {
        let token;
        if (req.headers?.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies.jwt) {
            token = req.cookies.jwt;
        };
        if (!token) {
            logger.warn("Unauthorized: Missing JWT token in request.");
            return unauthorized(res, "No token provided. Please login.");
        }

        const decoded = await verifyJwt(token, config.jwt.secret);
        if (!decoded?.id || !decoded?.token) {
            logger.error("Invalid or malformed JWT token:", JSON.stringify(decoded));
            return unauthorized(res, "Invalid or expired token.");
        };

        const user = await User.findById(decoded.id).select("+password_changed_at +token");
        if (!user) {
            logger.warn(`Unauthorized: Token belongs to a deleted or inactive user (ID: ${decoded?.id}).`);
            return unauthorized(res, "User no longer exists. Please sign up or contact support.");
        };
        if (user.token !== decoded.token) return unauthorized(res, "Invalid or expired token");
        if (!user.active) return forbidden(res, "Your account has been deactivated.");
        if (!user.email_verified) return unauthorized(res, "Please verify your email first.");
        if (user.changedPasswordAfter(decoded.iat)) return unauthorized(res, "Password recently changed. Please login again.");

        // GRANT ACCESS TO PROTECTED ROUTE
        req.user = user;
        res.locals.user = user;

        next();
    } catch (error) {
        console.log("Error Authentication:", error?.message || "");
        logger.error("Error occured while Authentication: ", JSON.stringify({ message: error?.message || "", stack: error?.stack }));
        return serverError(res, "Error verifying your session. Please try again later.", error);
    } finally {
        logRequestDetails(req);
    };
};


/* ------------- Middleware to restrict routes to certain roles ------------- */
exports.restrictTo = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) return forbidden(res, "You do not have permission to perform this action");
        next();
    };
};


/* --------------- Client Side Token verification (for login) --------------- */
exports.token_verify = async (req, res) => {
    setupLogger("authentication");
    try {
        let { token } = req.query;
        if (!token) {
            logger.warn("Unauthorized: Missing JWT token in request.");
            return unauthorized(res, "No token provided. Please login.");
        }

        const decoded = await verifyJwt(token, config.jwt.secret);
        if (!decoded?.id || !decoded?.token) {
            logger.error("Invalid or malformed JWT token:", JSON.stringify(decoded));
            return unauthorized(res, "Invalid or expired token.");
        };

        const user = await User.findById(decoded.id).select("+password_changed_at +token");
        if (!user) {
            logger.warn(`Unauthorized: Token belongs to a deleted or inactive user (ID: ${decoded?.id}).`);
            return unauthorized(res, "User no longer exists.");
        };
        if (user.token !== decoded.token) return unauthorized(res, "Token expired or replaced by a new login session.");
        if (!user.active) return forbidden(res, "Your account is deactivated.");
        if (!user.email_verified) return unauthorized(res, "Please verify your email first.");
        if (user.changedPasswordAfter(decoded.iat)) return unauthorized(res, "Password recently changed. Please login again.");

        return success(res, { _id: user._id, email: user.email, verified: user.email_verified }, "Token verified successfully.");
    } catch (error) {
        console.log("Error Authentication:", error?.message || "");
        logger.error("Error occured while Authentication: ", JSON.stringify({ message: error?.message || "", stack: error?.stack }));
        return serverError(res, "Error verifying your session. Please try again later.", error);
    } finally {
        logRequestDetails(req);
    };
};
// ./src/controller/auth.controller.js

const User = require("../models/user.model.js");
const crypto = require("crypto");
const { generateOTP } = require("../helpers/common.js");
const { createToken } = require("../middlewares/auth.js");
const { sendMail, generateEmailMessage } = require("../helpers/mail.js");
const { setupLogger, logger, logRequestDetails } = require("../helpers/logger");
const {
    badRequest,
    conflict,
    success,
    serverError,
    notFound,
    unauthorized,
    forbidden,
    created } = require("../utils/responses");

const logfile_folder = "auth_controller";

/* -------------------------------------------------------------------------- */
/*                          AUTH Controllers Function                         */
/* -------------------------------------------------------------------------- */
exports.register = async (req, res) => {
    setupLogger(`${logfile_folder}/register`);
    try {
        let { first_name, last_name, email, password } = req.body;
        if (!first_name || !email || !password) {
            logger.warn(`BadRequest: Missing required fields --> ${JSON.stringify(req.body)}`);
            return badRequest(res, "First name, email, or password are required.");
        };

        if (first_name) first_name = first_name.trim();
        if (last_name) last_name = last_name.trim();
        if (email) email = email.toLowerCase().trim();

        const emailExist = await User.exists({ email });
        if (emailExist) {
            logger.warn(`Conflict: Email already exists --> ${JSON.stringify(emailExist)}`);
            return conflict(res, `User already exists with this email "${email}"`);
        };

        const user = await User.create({ first_name, last_name, email, password });
        logger.info(`New user registered successfully: ${JSON.stringify({ user })}`);

        return created(res, { email: user.email, verified: user.email_verified }, "Registration successful. Please verify the OTP sent to your email.");
    } catch (error) {
        console.log("Register Error:", error?.message || "");
        logger.error("Error during registration: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
        return serverError(res, "Internal server error occurred while registration.", error);
    } finally {
        logRequestDetails(req);
    };
};

exports.sent_otp = async (req, res) => {
    setupLogger(`${logfile_folder}/sent_otp`);
    try {
        let { type, email } = req.query;
        if (!email) {
            logger.warn(`BadRequest: Missing required fields --> ${JSON.stringify(req.query)}`);
            return badRequest(res, "Email is required.");
        };

        if (email) email = email.toLowerCase().trim();
        if (!["register", "login"].includes(type)) return badRequest(res, "Invalid type. Allowed values: register or login");

        const user = await User.findOne({ email }).select("+otp +otp_expiry +login_otp +login_otp_expiry");
        if (type === "register" && user.email_verified) return success(res, { email: user.email, verified: user.email_verified }, "Email already verified. Please login.");
        if (!user) {
            logger.warn(`Notfound: User --> ${JSON.stringify(user)}`);
            return notFound(res, `User not found with this email "${email}". Please register first.`);
        };

        const OTP = generateOTP();
        const expiry = new Date(Date.now() + 10 * 60 * 1000);
        const typeCap = type.charAt(0).toUpperCase() + type.slice(1);

        if (type === "register") {
            user.otp = OTP;
            user.otp_expiry = expiry;
        };

        if (type === "login") {
            user.login_otp = OTP;
            user.login_otp_expiry = expiry;
        };

        await user.save();

        await sendMail({
            to: user.email,
            subject: `Your ${typeCap} OTP Request`,
            html: generateEmailMessage(
                `${typeCap} Verification`,
                `Thank you for ${typeCap} to IconBuzzer. Please verify using the below OTP:`,
                user.first_name || "User",
                OTP
            )
        });

        return success(res, { email: user.email, verified: user.email_verified }, `OTP sent to "${user.email}"`);
    } catch (error) {
        console.log("Error sent OTP:", error?.message || "");
        logger.error("Error occurred while sending OTP: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
        return serverError(res, "Internal server error occurred while sending OTP.", error);
    } finally {
        logRequestDetails(req);
    };
};

exports.verify_otp = async (req, res) => {
    setupLogger(`${logfile_folder}/verify_otp`);
    try {
        let { type, email, otp } = req.body;
        if (!email || !otp) return badRequest(res, "Email and OTP are required!");

        email = email.toLowerCase().trim();
        if (!["register", "login"].includes(type)) return badRequest(res, "Invalid type. Allowed values: register or login");

        const user = await User.findOne({ email }).select("+otp +otp_expiry +login_otp +login_otp_expiry");
        if (!user) {
            logger.warn(`Notfound: User --> ${JSON.stringify(user)}`);
            return notFound(res, `User not found with email "${email}"!`);
        };

        if (type === "register") {
            if (!user.otp || !user.otp_expiry) return badRequest(res, "OTP was not requested or has already been verified!");
            if (user.otp !== otp) return unauthorized(res, "Invalid OTP!");
            if (new Date(user.otp_expiry) < new Date()) return unauthorized(res, "OTP expired!");

            user.email_verified = true;
            user.otp = null;
            user.otp_expiry = null;
        };

        if (type === "login") {
            if (!user.login_otp || !user.login_otp_expiry) return badRequest(res, "OTP was not requested or has already been verified!");
            if (user.login_otp !== otp) return unauthorized(res, "Invalid OTP!");
            if (new Date(user.login_otp_expiry) < new Date()) return unauthorized(res, "OTP expired!");

            user.login_otp = null;
            user.login_otp_expiry = null;
        };

        await user.save();

        return success(res, { email: user.email, verified: user.email_verified }, "OTP verified successfully");
    } catch (error) {
        console.log("Error verify OTP:", error?.message || "");
        logger.error("Error occurred while verify OTP: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
        return serverError(res, "Internal server error occurred while varify OTP.", error);
    } finally {
        logRequestDetails(req);
    };
};

exports.login = async (req, res) => {
    setupLogger(`${logfile_folder}/login`);
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            logger.warn(`BadRequest: Missing required fields --> ${JSON.stringify(req.body)}`);
            return badRequest(res, "Email and password are required.");
        };

        const user = await User.findOne({ email }).select("+password +login_attempts +lock_until");
        if (!user) {
            logger.warn(`Login failed: User not found with email "${email}"`);
            return notFound(res, `No user found with email: ${email}`);
        };
        if (!user.email_verified) return unauthorized(res, "Email not verified. Please verify your email first.");
        if (!user.active) return forbidden(res, "Your account is deactivated. Contact support.");
        if (user.isLocked) return unauthorized(res, "Your account is temporarily locked due to too many failed attempts.");

        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            await user.incrementLoginAttempts();
            logger.warn(`Unauthorized: Incorrect credentials for "${email}"`);
            return unauthorized(res, "Incorrect email or password. Please try again.");
        };

        await user.resetLoginAttempts();

        const token = user.createLoginToken(createToken);
        if (!token) {
            logger.error(`ServerError: Failed to create JWT token for user ID: ${user._id}`);
            return serverError(res, "Failed to generate authentication token. Please try again later.")
        };

        user.password_reset_token = undefined;
        user.password_reset_expires = undefined;
        user.last_login = new Date();
        await user.save();

        return success(res, { token, user: { _id: user._id, role: user.role } }, "Logged in successfully");
    } catch (error) {
        console.log("Login Error:", error?.message || "");
        logger.error("Error occured while login: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
        return serverError(res, "Internal server error occured while login.", error);
    } finally {
        logRequestDetails(req);
    };
};

exports.forgot_password = async (req, res, next) => {
    setupLogger(`${logfile_folder}/forgot-password`);
    try {
        const { email } = req.query;
        if (!email) {
            logger.warn(`BadRequest: Missing email field --> ${JSON.stringify(req.query)}`);
            return badRequest(res, "Email is required.");
        }

        const user = await User.findOne({ email });
        if (!user) {
            logger.warn(`NotFound: User with email "${email}" not found.`);
            return notFound(res, `No user found with this email: ${email}`);
        }

        const resetToken = user.createPasswordResetToken();
        if (!resetToken) {
            logger.error(`ServerError: Failed to create password reset token for user ID: ${user._id}`);
            return serverError(res, "Failed to generate password reset token. Please try again later.");
        };

        await user.save({ validateBeforeSave: false });

        try {
            await sendMail({
                to: user.email,
                subject: "Reset Your Password",
                html: generateEmailMessage(
                    "Password Reset Request",
                    "We received a request to reset your password. Use the TOKEN below to reset your password:",
                    user?.name || "User",
                    resetToken
                ),
            });

            logger.info(`Password reset token sent successfully to email: "${email}"`);

            return success(res, null, `Reset token sent to "${user.email}"`);
        } catch (error) {
            user.password_reset_token = undefined;
            user.password_reset_expires = undefined;

            await user.save({ validateBeforeSave: false });

            logger.error("Error while sending reset email: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
            return serverError(res, "Error sending reset email. Please try again later!.", error);
        }
    } catch (error) {
        console.log("Error occure while forgot password process:", error?.message || "");
        logger.error("Error occure while forgot password process: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
        return serverError(res, "Internal server error occure while forgot password.", error);
    } finally {
        logRequestDetails(req);
    }
};

exports.reset_password = async (req, res) => {
    setupLogger(`${logfile_folder}/reset-password`);
    try {
        const { token } = req.query;
        const { password } = req.body;
        if (!token || !password) {
            const missingField = !token ? "Reset token" : "Password";
            logger.warn(`BadRequest: Missing ${missingField}.`);
            return badRequest(res, `${missingField} is required.`);
        };

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const user = await User.findOne({ password_reset_token: hashedToken, password_reset_expires: { $gt: Date.now() } });
        if (!user) {
            logger.warn(`NotFound: Invalid or expired reset token.`);
            return notFound(res, "Token is invalid or has expired.");
        };

        const authToken = user.createLoginToken(createToken);
        if (!authToken) {
            logger.error(`ServerError: Failed to create JWT token for user ID: ${user.id}`);
            return serverError(res, "Password reset completed, but failed to generate auth token.");
        };

        user.password = password;
        user.password_reset_token = undefined;
        user.password_reset_expires = undefined;

        await user.save();

        return success(res, { token: authToken, user: { _id: user._id, role: user.role } }, "Password reset successful");
    } catch (error) {
        console.log("Reset password Error:", error?.message || "");
        logger.error("Error during reset password: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
        return serverError(res, "Internal server error occured while reset password.", error);
    } finally {
        logRequestDetails(req);
    }
};
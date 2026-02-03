// ./src/helpers/mail.js

const nodemailer = require("nodemailer");
const { config } = require("../configs/envConfig.js");
const { logger, setupLogger } = require("./logger.js");

/* -------------------------------------------------------------------------- */
/*                      Create reusable SMTP transporter                      */
/* -------------------------------------------------------------------------- */
/**
 * @type {Object}
 * @description Create reusable SMTP transporter
 * @returns {Object}
 * @throws {Error}
 */
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: config.email.sender,
        pass: config.email.pass,
    },
});


/* -------------------------------------------------------------------------- */
/*                    Verify SMTP configuration at startup                    */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Verify SMTP configuration at startup
 * @returns {Promise}
 * @throws {Error}
 */
transporter.verify()
    .then(() => {
        console.log("📧 Mail transporter ready");
    }).catch((err) => {
        setupLogger("Email");
        console.log("📧 Mail transporter verify failed:", err?.message);
        logger.warn(`Mail transporter verify failed: ${err?.message}`);
    });


/* -------------------------------------------------------------------------- */
/*                                Send an email                               */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Send an email using the configured transporter
 * @param {Object} opts
 * @param {string} opts.to - Recipient email address
 * @param {string} opts.subject - Email subject
 * @param {string} [opts.html] - HTML content
 * @param {string} [opts.text] - Plain text content
 */
exports.sendMail = ({ to, subject, html, text }) => {
    if (!to || !subject) throw new Error("to and subject are required for sendMail");
    const mailOptions = {
        from: config.email.sender,
        to,
        subject,
        text: text || undefined,
        html: html || undefined,
    };

    return transporter.sendMail(mailOptions);
};


/* -------------------------------------------------------------------------- */
/*                         Common HTML Email Template                         */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Generate a styled HTML email message
 * @param {string} header - Email heading/title
 * @param {string} description - Email body text
 * @param {string} user - Recipient's name
 * @param {string} token - OTP or verification token
 * @returns {string} - Formatted HTML message
 */
exports.generateEmailMessage = (header, description, user, token, support = "support@example.com") => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333333; text-align: center; margin-bottom: 20px;">${header}</h2>
            <p style="color: #555555; font-size: 14px;">Hello ${user.toUpperCase()},</p>
            <p style="color: #555555; font-size: 14px;">${description}</p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="display: inline-block; font-size: 12px; font-weight: bold; color: #007bff; background-color: #e7f3ff; padding: 5px 10px; border-radius: 10px; border: 1px solid #007bff;">${token}</span>
            </div>
            <p style="color: #9aa4b2; font-size: 13px; text-align: center;">This token expires in <strong>10 minutes</strong>.For your safety, do not share this code with anyone.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eeeeee;">
            <p style="margin-top: 18px; font-size: 13px; color: #8da0b3; text-align: center;">Need help? Contact us at <a href="mailto:${support}" style="color: #0b5cff; text-decoration: none;">${support}</a>
            </p>
            <p style="margin-top: 10px; font-size: 13px; color: #6b7280; text-align: center;">If you did not request this, please ignore this email.</p>
        </div>
    </div>
    `;
};

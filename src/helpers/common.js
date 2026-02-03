// ./src/helpers/common.js

const crypto = require("crypto");

/* -------------------------------------------------------------------------- */
/*              CREATE RANDOM PROFILE PICTURE USING DICEBEAR API              */
/* -------------------------------------------------------------------------- */
/**
 * Generate a random profile picture URL using Dicebear API
 * @param {string} seed - Seed value to generate consistent avatars
 * @returns {string} - URL of the generated avatar
 */
exports.randomProfilePicture = (seed) => {
    const style = ["adventurer", "bottts", "micah", "pixel-art", "avataaars"];
    const randomStyle = style[Math.floor(Math.random() * style.length)];
    const encodedSeed = encodeURIComponent(seed);

    const URL = `https://api.dicebear.com/9.x/${randomStyle}/svg?seed=${encodedSeed}`;
    return URL;
};

/* -------------------------------------------------------------------------- */
/*                               OTP GENERATION                               */
/* -------------------------------------------------------------------------- */
/**
 * Generate a 6-digit OTP
 * @returns {String} 6-digit OTP
 */
exports.generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
};
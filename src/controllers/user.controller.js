// ./src/controllers/user.controller.js

const Mongoose = require("mongoose");
const User = require("../models/user.model.js");
const { createToken } = require("../middlewares/auth.js");
const { setupLogger, logger, logRequestDetails } = require("../helpers/logger.js");
const {
  success,
  serverError,
  notFound,
  unauthorized,
  paginated,
  badRequest } = require("../utils/responses.js");

const logfile_folder = "user_controller";

/* -------------------------------------------------------------------------- */
/*                   User authentication Routes Controllers                   */
/* -------------------------------------------------------------------------- */
exports.get_me = async (req, res) => {
  setupLogger(`${logfile_folder}/me`);
  try {
    const user = await User.findById(req.user.id);

    return success(res, user, "profile retrieved successfully");
  } catch (error) {
    console.log("Getting me Error:", error?.message || "");
    logger.error("Error during get me: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
    return serverError(res, "Internal server error occured while retrieving user data.", error);
  } finally {
    logRequestDetails(req);
  };
};

exports.update_me = async (req, res) => {
  setupLogger(`${logfile_folder}/update-me`);
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      logger.warn("Unauthorized: Token is invalid or has expired.");
      return unauthorized(res, "Your session has expired or token is invalid. Please log in again.");
    };

    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.exists({ email: req.body.email, _id: { $ne: req.user.id } });
      if (emailExists) return conflict(res, "This email is already registered with another account.");

      req.body.email_verified = false;
    };

    const updateUser = await User.findByIdAndUpdate(
      req.user.id,
      req.body,
      { new: true, runValidators: true }
    );

    return success(res, updateUser, "Your profile has been updated successfully.");
  } catch (error) {
    console.log("Update me Error:", error?.message || "");
    logger.error("Error during updating me: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
    return serverError(res, "Internal server error occured while updating your profile", error);
  } finally {
    logRequestDetails(req);
  };
};

exports.update_password = async (req, res) => {
  setupLogger(`${logfile_folder}/update-password`);
  try {
    const { password, newPassword } = req.body;
    if (!password || !newPassword) {
      logger.warn("BadRequest: Missing current or new password.");
      return badRequest(res, "Both current and new passwords are required.");
    };

    const user = await User.findById(req.user.id).select("+password");
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn(`Incorrect current password entered for user ID: ${user._id}`);
      return unauthorized(res, "Your current password is incorrect. Please try again.");
    };

    if (password === newPassword) {
      logger.warn(`User ID: ${user._id} attempted to reuse the same password.`);
      return badRequest(res, "Your new password cannot be the same as the old one.");
    };

    const token = await user.createLoginToken(createToken);
    if (!token) {
      logger.error(`ServerError: Failed to create JWT token for user ID: ${user._id}`);
      return serverError(res, "Failed to generate authentication token. Please try again later.")
    };

    user.password = newPassword;
    await user.save();

    return success(res, { token, user: { _id: user._id, role: user.role } }, "Your password has been updated successfully");
  } catch (error) {
    console.log("Updating password Error:", error?.message || "");
    logger.error("Error during updating password: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
    return serverError(res, "Internal server error occurred while updating password.", error);
  } finally {
    logRequestDetails(req);
  };
};


/* -------------------------------------------------------------------------- */
/*                      Admin Restrict Routes Controllers                     */
/* -------------------------------------------------------------------------- */
exports.user_list = async (req, res) => {
  setupLogger(`${logfile_folder}/user/list`);
  try {
    const users = await User.find({ role: "user" }).sort();
    return success(res, users, "Users retrieved successfully");
  } catch (error) {
    console.log("Error occure while retrieving user list:", error?.message || "");
    logger.error("Error occure while retrieving user list: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
    return serverError(res, "Internal server error occured while retrieving user list.", error);
  } finally {
    logRequestDetails(req);
  };
};

exports.user_pagelist = async (req, res) => {
  setupLogger(`${logfile_folder}/user/pagelist`);
  try {
    let { page = 1, limit = 10, search = "", sort = "createdAt", order = -1 } = req.query;

    order = Number(order);
    page = Number(page);
    limit = Number(limit);
    if (isNaN(page) || page < 1) {
      logger.warn(`BadRequest: Invalid page number (${req.query.page})`);
      return badRequest(res, "Invalid page number. Page must be a positive integer.");
    };
    if (isNaN(limit) || limit < 1 || limit > 100) {
      logger.warn(`BadRequest: Invalid limit (${req.query.limit})`);
      return badRequest(res, "Invalid limit. Limit must be between 1 and 100.");
    };

    let filter = { role: "user" };
    if (search?.trim()?.length) {
      filter.$or = [
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { "profile.address.city": { $regex: search, $options: "i" } },
        { "profile.address.state": { $regex: search, $options: "i" } },
        { "profile.address.country": { $regex: search, $options: "i" } },
        { "profile.address.zip_code": { $regex: search, $options: "i" } }
      ];
    };

    const sortMenu = {
      city: "profile.address.city",
      state: "profile.address.state",
      country: "profile.address.country",
      zip_code: "profile.address.zip_code"
    };

    let sortOption = {};
    sortMenu[sort]
      ? sortOption[sortMenu[sort]] = order
      : sortOption[sort] = order;

    const [totalUsers, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
    ]);

    return paginated(res, users, totalUsers, page, limit, "Users retrieved successfully");
  } catch (error) {
    console.log("Error occure while retrieving user pagelist:", error?.message || "");
    logger.error("Error occure while retrieving user pagelist: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
    return serverError(res, "Internal server error occured while retrieving users.", error);
  } finally {
    logRequestDetails(req);
  };
};

exports.user_byid = async (req, res) => {
  setupLogger(`${logfile_folder}/user/byid`);
  try {
    const { _id } = req.query;
    if (!Mongoose.Types.ObjectId.isValid(_id)) return badRequest(res, "Invalid Category ID format");

    const user = await User.findById({ _id });
    if (!user) {
      logger.warn(`NotFound: No user found with ID: ${_id}`);
      return notFound(res, "No user found with that ID");
    };

    return success(res, user, "User retrieved successfully");
  } catch (error) {
    console.log("Error retrieved user:", error?.message || "");
    logger.error("Error retrieved user: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
    return serverError(res, "Internal server error occured while retrieving used.", error);
  } finally {
    logRequestDetails(req);
  };
};

exports.user_statusUpdate = async (req, res) => {
  setupLogger(`${logfile_folder}/user/status`);
  try {
    const { _id, active } = req.query;
    if (!Mongoose.Types.ObjectId.isValid(_id)) return badRequest(res, "Invalid Category ID format");
    if (typeof active === "undefined") return badRequest(res, "The 'active' field is required to update the user.");

    const activeValue = active === "true" ? true : active === "false" ? false : null;
    if (activeValue === null) {
      logger.warn(`BadRequest: Invalid active value '${active}'.`);
      return badRequest(res, "The 'active' query parameter must be either true or false.");
    };

    const user = await User.findByIdAndUpdate(
      { _id },
      { active },
      { new: true, runValidators: true }
    );
    if (!user) {
      logger.warn(`NotFound: No user found with ID ${_id}`);
      return notFound(res, "No user found with that ID");
    };

    return success(res, user, "User status updated successfully.");
  } catch (error) {
    console.log("Error occured updating user status:", error?.message || "");
    logger.error("Error occured updating user status: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
    return serverError(res, "Internal server error while updating user status.", error);
  } finally {
    logRequestDetails(req);
  };
};

exports.user_delete = async (req, res) => {
  setupLogger(`${logfile_folder}/user/delete`);
  try {
    const { _ids } = req.body;
    if (!_ids?.length) return badRequest(res, "No valid IDs provided for deletion");

    for (let id of _ids) {
      if (!Mongoose.Types.ObjectId.isValid(id)) return badRequest(res, `Invalid ID format: ${id}`);
    };

    const existDocs = await User.find({ _id: { $in: _ids } }, { _id: 1 }).lean();
    const existingIds = existDocs.map(doc => doc._id.toString());
    const missingIds = _ids.filter(id => !existingIds.includes(id));

    // Delete only the valid ones
    let result = { deletedCount: 0 };
    if (existingIds?.length) {
      result = await User.deleteMany({ _id: { $in: existingIds } });
    };

    // Prepare response
    const response = {
      deleted_count: result.deletedCount,
      deleted_ids: existingIds,
      missing_ids: missingIds,
    };

    if (missingIds?.length && existingIds?.length) {
      return success(res, response, "Some user deleted, some not found.");
    } else if (missingIds?.length) {
      return notFound(res, `No valid user found. Missing IDs: ${missingIds.join(", ")}`);
    };

    return success(res, response, "All user deleted successfully.");
  } catch (error) {
    console.log("Error occured while deleting user:", error?.message || "");
    logger.error("Error occured while deleting user:", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
    return serverError(res, "Internal server error occured while deleting user.", error);
  } finally {
    logRequestDetails(req);
  };
};

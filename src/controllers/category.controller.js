// ./src/controllers/category.controller.js

const Mongoose = require("mongoose");
const Category = require("../models/category.model.js");
const { setupLogger, logger, logRequestDetails } = require("../helpers/logger.js");
const {
    success,
    serverError,
    badRequest,
    paginated,
    notFound,
    conflict } = require("../utils/responses.js");

const logfile_folder = "category_controller";

// Category Create Controller Function
exports.category_create = async (req, res) => {
    setupLogger(`${logfile_folder}/create`);
    try {
        const category = await Category.create(req.body);
        return success(res, category, "Category create successfully");
    } catch (error) {
        console.log("Error occure while create category:", error?.message || "");
        logger.error("Error occure while create category: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
        return serverError(res, "Internal server error occured while create category.", error);
    } finally {
        logRequestDetails(req);
    };
};

// Category List Controller Function
exports.category_list = async (req, res) => {
    setupLogger(`${logfile_folder}/list`);
    try {
        const list = await Category.find();
        return success(res, list, "Categories retriving successfully");
    } catch (error) {
        console.log("Error occure while retriving category list:", error?.message || "");
        logger.error("Error occure while retriving category list: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
        return serverError(res, "Internal server error occured while retriving categories.", error);
    } finally {
        logRequestDetails(req);
    };
};

// Category Pagelist Controller Function
exports.category_pagelist = async (req, res) => {
    setupLogger(`${logfile_folder}/pagelist`);
    try {
        let { page = 1, limit = 10, search = "", sort, order = -1 } = req.query;

        order = Number(order);
        page = Number(page);
        limit = Number(limit);
        if (isNaN(page) || page < 1) return badRequest(res, `Invalid page number. "page" must be a positive integer.`);
        if (isNaN(limit) || limit < 1 || limit > 100) return badRequest(res, `Invalid limit. "limit" must be between 1 and 100.`);

        let filter = {};
        if (search?.trim()?.length) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { slug: { $regex: search, $options: "i" } }
            ];
        }

        let sortOption = {};
        if (sort?.trim()?.length) sortOption[sort] = order;
        else sortOption.createdAt = order;

        const [totalCategories, categories] = await Promise.all([
            Category.countDocuments(filter),
            Category.find(filter)
                .sort(sortOption)
                .skip((page - 1) * limit)
                .limit(limit)
        ]);

        return paginated(res, categories, totalCategories, page, limit, "Categories retrieved successfully");
    } catch (error) {
        console.log("Error occure while retriving category list:", error?.message || "");
        logger.error("Error occure while retriving category list: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
        return serverError(res, "Internal server error occured while retriving categories.", error);
    } finally {
        logRequestDetails(req);
    };
};

// Category Update Controller Function
exports.category_statusUpdate = async (req, res) => {
    setupLogger(`${logfile_folder}/status`);
    try {
        const { _id, active } = req.query;
        if (!Mongoose.Types.ObjectId.isValid(_id)) return badRequest(res, "Invalid Category ID format");
        if (typeof active === "undefined") return badRequest(res, "The 'active' field is required to update the user.");

        const activeValue = active === "true" ? true : active === "false" ? false : null;
        if (activeValue === null) return badRequest(res, "The 'active' query parameter must be either true or false.");

        const category = await Category.findByIdAndUpdate(
            { _id },
            { active },
            { new: true, runValidators: true }
        );
        if (!category) return notFound(res, "No category found with that ID");

        return success(res, category, "Category status updated successfully.");
    } catch (error) {
        console.log("Error occured updating category status:", error?.message || "");
        logger.error("Error occured updating category status: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
        return serverError(res, "Internal server error while updating category status.", error);
    } finally {
        logRequestDetails(req);
    };
};

// Category Data Update Controller Function
exports.category_update = async (req, res) => {
    setupLogger(`${logfile_folder}/update`);
    try {
        const { _id } = req.query;
        if (!Mongoose.Types.ObjectId.isValid(_id)) return badRequest(res, "Invalid Category ID format");
        if (!_id) return badRequest(res, "A valid category ID is required.");

        let { name, active } = req.body;
        const existCategory = await Category.findById(_id);
        if (!existCategory) return notFound(res, "Category not found");

        // Check for existing model with the same name
        if (name && name !== existCategory.name) {
            const duplicateCategory = await Category.findOne({ name });
            if (duplicateCategory) return conflict(res, `Category with this name '${name}' already exists`);
            existCategory.name = name;
        }
        if (active && typeof active === "boolean") existCategory.active = active;

        await existCategory.save();

        return success(res, existCategory, "Category updated successfully.");
    } catch (error) {
        console.log("Error occured updating category:", error?.message || "");
        logger.error("Error occured updating category: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
        return serverError(res, "Internal server error while updating category.", error);
    } finally {
        logRequestDetails(req);
    };
};

// Category Delete Controller Function
exports.category_delete = async (req, res) => {
    setupLogger(`${logfile_folder}/delete`);
    try {
        const { _ids } = req.body;
        if (!_ids?.length) return badRequest(res, "No IDs provided for deletion");

        for (let id of _ids) {
            if (!Mongoose.Types.ObjectId.isValid(id)) return badRequest(res, `Invalid ID format: ${id}`);
        };

        const existDocs = await Category.find({ _id: { $in: _ids } }, { _id: 1 }).lean();
        const existingIds = existDocs.map(doc => doc._id.toString());
        const missingIds = _ids.filter(id => !existingIds.includes(id));

        // Delete only the valid ones
        let result = { deletedCount: 0 };
        if (existingIds?.length) {
            result = await Category.deleteMany({ _id: { $in: existingIds } });
        };

        // Prepare response
        const response = {
            deleted_count: result.deletedCount,
            deleted_ids: existingIds,
            missing_ids: missingIds,
        };

        if (missingIds?.length && existingIds?.length) {
            return success(res, response, "Some categories deleted, some not found.");
        } else if (missingIds?.length) {
            return notFound(res, `No valid categories found. Missing IDs: ${missingIds.join(", ")}`);
        };

        return success(res, response, "All categories deleted successfully.");
    } catch (error) {
        console.log("Error occured while deleting category:", error?.message || "");
        logger.error("Error occured while deleting category:", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
        return serverError(res, "Internal server error occured while deleting category.", error);
    } finally {
        logRequestDetails(req);
    };
};
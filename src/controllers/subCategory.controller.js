// ./src/controllers/subCategory.controller.js

const Mongoose = require("mongoose");
const Category = require("../models/category.model.js");
const Subcategory = require("../models/subCategory.model.js");
const { setupLogger, logger, logRequestDetails } = require("../helpers/logger.js");
const {
    success,
    serverError,
    paginated,
    notFound,
    conflict } = require("../utils/responses.js");

const logfile_folder = "subcategory_controller";

// Create Subcategory Controller Function
exports.subCategory_create = async (req, res) => {
    setupLogger(`${logfile_folder}/create`);
    try {
        const subcategory = await Subcategory.create(req.body);
        return success(res, subcategory, "subcategory create successfully");
    } catch (error) {
        console.log("Error occure while create subcategory:", error?.message || "");
        logger.error("Error occure while create subcategory: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
        return serverError(res, "Internal server error occured while create subcategory.", error);
    } finally {
        logRequestDetails(req);
    };
};

// List Subcategory Controller Function
exports.subCategory_list = async (req, res) => {
    setupLogger(`${logfile_folder}/list`);
    try {
        const subCategory = await Subcategory.find();
        return success(res, subCategory, "subcategory retriving successfully");
    } catch (error) {
        console.log("Error occure while retriving subcategory:", error?.message || "");
        logger.error("Error occure while retriving subcategory: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
        return serverError(res, "Internal server error occured while retriving subcategories.", error);
    } finally {
        logRequestDetails(req);
    };
};

// Pagelist Subcategory Controller Function
exports.subCategory_pagelist = async (req, res) => {
    setupLogger(`${logfile_folder}/pagelist`);
    try {
        let { page = 1, limit = 10, search = "", sort, order = -1 } = req.query;

        order = Number(order);
        page = Number(page);
        limit = Number(limit);
        if (isNaN(page) || page < 1) return badRequest(res, `Invalid page number. "page" must be a positive integer.`);
        if (isNaN(limit) || limit < 1 || limit > 100) return badRequest(res, `Invalid limit. "limit" must be between 1 and 100.`);

        let match = {};
        if (search.trim().length) {
            match.$or = [
                { name: { $regex: search, $options: "i" } },
                { slug: { $regex: search, $options: "i" } }
            ];
        }

        let sortStage = {};
        if (sort === "category") sortStage["category.name"] = order;
        else if (sort === "name") sortStage["name"] = order;
        else if (sort === "active") sortStage["active"] = order;
        else sortStage["createdAt"] = order;

        const pipeline = [
            { $match: match },
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "category"
                }
            },
            { $unwind: "$category" },
            { $sort: sortStage },
            { $skip: (page - 1) * limit },
            { $limit: limit },
        ];

        const [totalSubcategories, subcategories] = await Promise.all([
            Subcategory.countDocuments(match),
            Subcategory.aggregate(pipeline)
        ]);

        return paginated(res, subcategories, totalSubcategories, page, limit, "subcategory retrieved successfully");
    } catch (error) {
        console.log("Error occure while retriving subcategory:", error?.message || "");
        logger.error("Error occure while retriving subcategory: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
        return serverError(res, "Internal server error occured while retriving subcategories.", error);
    } finally {
        logRequestDetails(req);
    };
};

// List by Category ID wise Controller Function
exports.subCategory_byCatId = async (req, res) => {
    setupLogger(`${logfile_folder}/by_category`);
    try {
        const { search = "" } = req.query;
        const { _id } = req.params;
        if (!Mongoose.Types.ObjectId.isValid(_id)) return badRequest(res, "Invalid Category ID format");

        const exisCat = await Category.exists({ _id, active: true });
        if (!exisCat) return notFound(res, "Category not found or is deactivated");

        // Build filter
        const filter = { active: true, category: new Mongoose.Types.ObjectId(_id) };
        if (search?.trim()?.length) filter.name = { $regex: search, $options: "i" };

        const Subcategories = await Subcategory.aggregate([{ $match: filter }, { $sort: { createdAt: -1 } }]);

        return success(res, Subcategories, "subcategory retrieved successfully");
    } catch (error) {
        console.log("Error occure while retriving subcategory:", error?.message || "");
        logger.error("Error occure while retriving subcategory: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
        return serverError(res, "Internal server error occured while retriving subcategories.", error);
    } finally {
        logRequestDetails(req);
    };
};

// Update Status of Subcategory Controller Function
exports.subCategory_statusUpdate = async (req, res) => {
    setupLogger(`${logfile_folder}/status`);
    try {
        const { _id, active } = req.query;
        if (!Mongoose.Types.ObjectId.isValid(_id)) return badRequest(res, "Invalid Category ID format");
        if (typeof active === "undefined") return badRequest(res, "The 'active' field is required to update the user.");

        const activeValue = active === "true" ? true : active === "false" ? false : null;
        if (activeValue === null) return badRequest(res, "The 'active' query parameter must be either true or false.");

        const subcategory = await Subcategory.findByIdAndUpdate(
            { _id },
            { active },
            { new: true, runValidators: true }
        );
        if (!subcategory) return notFound(res, "No subcategory found with that ID");

        return success(res, subcategory, "subcategory status updated successfully.");
    } catch (error) {
        console.log("Error occured updating subcategory status:", error?.message || "");
        logger.error("Error occured updating subcategory status: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
        return serverError(res, "Internal server error while updating subcategory status.", error);
    } finally {
        logRequestDetails(req);
    };
};

// Update Subcategory Data Controller Function
exports.subCategory_update = async (req, res) => {
    setupLogger(`${logfile_folder}/update`);
    try {
        const { _id } = req.query;
        if (!_id || !Mongoose.Types.ObjectId.isValid(_id)) return badRequest(res, "Invalid Category ID format");

        let { category, name } = req.body;
        const existCategory = await Category.exists({ _id: category, active: true });
        if (!existCategory) return notFound(res, "Selected Category is deactivated or deleted");

        const existSubcategory = await Subcategory.findById(_id);
        if (!existSubcategory) return notFound(res, "Subcategory not found");

        // Check for existing model with the same name
        if (name && name !== existSubcategory.name) {
            const duplicateSubcategory = await Subcategory.findOne({ name, category, _id: { $ne: _id } });
            if (duplicateSubcategory) return conflict(res, `Subcategory '${name}' already exists under this category`);
        };

        const updateSubcategory = await Subcategory.findByIdAndUpdate(_id, { ...req.body }, { new: true, runValidators: true, context: "query" });

        return success(res, updateSubcategory, "subcategory updated successfully.");
    } catch (error) {
        console.log("Error occured updating subcategory:", error?.message || "");
        logger.error("Error occured updating subcategory: ", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
        return serverError(res, "Internal server error while updating subcategory.", error);
    } finally {
        logRequestDetails(req);
    };
};

// Category Delete Controller Function
exports.subCategory_delete = async (req, res) => {
    setupLogger(`${logfile_folder}/delete`);
    try {
        const { _ids } = req.body;
        if (!_ids?.length) return badRequest(res, "No IDs provided for deletion.");

        for (let id of _ids) {
            if (!Mongoose.Types.ObjectId.isValid(id)) return badRequest(res, `Invalid ID format: ${id}`);
        };

        const existDocs = await Subcategory.find({ _id: { $in: _ids } }, { _id: 1 }).lean();
        const existingIds = existDocs.map(doc => doc._id.toString());
        const missingIds = _ids.filter(id => !existingIds.includes(id));

        // Delete only the valid ones
        let result = { deletedCount: 0 };
        if (existingIds?.length) {
            result = await Subcategory.deleteMany({ _id: { $in: existingIds } });
        };

        // Prepare response
        const response = {
            deleted_count: result.deletedCount,
            deleted_ids: existingIds,
            missing_ids: missingIds,
        };

        if (missingIds?.length && existingIds?.length) {
            return success(res, response, "Some subcategories deleted, some not found.");
        } else if (missingIds?.length) {
            return notFound(res, `No valid subcategories found. Missing IDs: ${missingIds.join(", ")}`);
        };

        return success(res, response, "All subcategories deleted successfully.");
    } catch (error) {
        console.log("Error occurred while deleting subcategory:", error?.message || "");
        logger.error("Error occurred while deleting subcategory:", JSON.stringify({ message: error?.message || "", stack: error?.stack || "" }));
        return serverError(res, "Internal server error occurred while deleting subcategory.", error);
    } finally {
        logRequestDetails(req);
    };
};
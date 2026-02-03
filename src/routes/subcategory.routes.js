// ./src/routes/subcategory.routes.js

const router = require("express").Router();
const validate = require("../middlewares/schemaValidation.js");
const { protect, restrictTo } = require("../middlewares/auth.js");
const { subCategoryValidation } = require("../validations/index.js");
const { subCategoryController } = require("../controllers/index.js");

router.use(protect, restrictTo(["admin"]));

router.post("/create", validate(subCategoryValidation.createSubcategory_validation), subCategoryController.subCategory_create);
router.get("/list", subCategoryController.subCategory_list);
router.get("/pagelist", validate(subCategoryValidation.pagelistSubcategory_validation), subCategoryController.subCategory_pagelist);
router.get("/list/:_id", validate(subCategoryValidation.listByCategoryId_validation), subCategoryController.subCategory_byCatId);
router.patch("/status", validate(subCategoryValidation.statusSubcategory_validation), subCategoryController.subCategory_statusUpdate);
router.put("/data", validate(subCategoryValidation.updateSubcategory_validation), subCategoryController.subCategory_update);
router.delete("/", validate(subCategoryValidation.deleteSubcategory_validation), subCategoryController.subCategory_delete);


module.exports = router;
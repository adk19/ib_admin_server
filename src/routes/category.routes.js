// ./src/routes/category.routes.js

const router = require("express").Router();
const validate = require("../middlewares/schemaValidation.js");
const { protect, restrictTo } = require("../middlewares/auth.js");
const { categoryValidation } = require("../validations/index.js");
const { categoryController } = require("../controllers/index.js");

router.use(protect, restrictTo(["admin"]));

router.post("/create", validate(categoryValidation.createCategory_validation), categoryController.category_create);
router.get("/list", categoryController.category_list);
router.get("/pagelist", validate(categoryValidation.pagelistCategory_validation), categoryController.category_pagelist);
router.patch("/status", validate(categoryValidation.statusCategory_validation), categoryController.category_statusUpdate);
router.put("/data", validate(categoryValidation.updateCategory_validation), categoryController.category_update);
router.delete("/", validate(categoryValidation.deleteCategory_validation), categoryController.category_delete);

module.exports = router;
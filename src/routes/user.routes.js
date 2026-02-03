// ./src/routes/user.routes.js

const router = require("express").Router();
const validate = require("../middlewares/schemaValidation.js");
const { protect, restrictTo } = require("../middlewares/auth.js");
const { userControllers } = require("../controllers/index.js");
const { userValidation } = require("../validations/index.js");


/* ---------------- Protected routes (require authentication) --------------- */
router.use(protect);
router.get("/me", userControllers.get_me);
router.patch("/update-me", validate(userValidation.updateMe_validation), userControllers.update_me);
router.patch("/update-password", validate(userValidation.updatePassword_validation), userControllers.update_password);


/* ------------------------ Restrict to "Admin" only ------------------------ */
router.use(restrictTo(["admin"]));
router.get("/list", userControllers.user_list);
router.post("/pagelist", validate(userValidation.userPagelist_validation), userControllers.user_pagelist);
router.get("/by", validate(userValidation.userId_validation), userControllers.user_byid);
router.patch("/status", validate(userValidation.userStatusUpdate_validation), userControllers.user_statusUpdate);
router.delete("/", validate(userValidation.userDelete_validation), userControllers.user_delete);


module.exports = router;

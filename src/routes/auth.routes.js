// ./src/routes/auth.routes.js

const router = require("express").Router();
const validate = require("../middlewares/schemaValidation.js");
const { token_verify } = require("../middlewares/auth.js");
const { authControllers } = require("../controllers/index.js");
const { authValidation } = require("../validations/index.js");

router.post("/register", validate(authValidation.register_validation), authControllers.register);
router.get("/sent-otp", validate(authValidation.sentOtp_validation), authControllers.sent_otp);
router.post("/verify-otp", validate(authValidation.varifyOTP_validation), authControllers.verify_otp);
router.post("/login", validate(authValidation.login_validation), authControllers.login);
router.get("/forgot-password", validate(authValidation.forgot_validation), authControllers.forgot_password);
router.patch("/reset-password", validate(authValidation.reset_validation), authControllers.reset_password);
router.get("/verify", validate(authValidation.tokenVerify_validation), token_verify);


module.exports = router;
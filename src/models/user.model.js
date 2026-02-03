// ./src/models/user.model.js

const Mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { randomProfilePicture, generateOTP } = require("../helpers/common.js");
const { sendMail, generateEmailMessage } = require("../helpers/mail.js");


/* ---------------------------- USER MODEL SCHEMA --------------------------- */
const userSchema = new Mongoose.Schema(
    {
        email: { type: String, trim: true, lowercase: true, required: true, unique: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        email_verified: { type: Boolean, default: false },

        first_name: { type: String, trim: true, required: true, maxlength: 50 },
        last_name: { type: String, trim: true, maxlength: 50, default: null },

        profile: {
            avatar: { type: String, trim: true, default: null },
            phone: { type: String, trim: true, default: null },
            address: {
                city: { type: String, trim: true, default: null },
                state: { type: String, trim: true, default: null },
                country: { type: String, trim: true, default: null },
                zip_code: { type: String, trim: true, default: null }
            }
        },

        password: { type: String, trim: true, required: true, minlength: 8, select: false },
        password_reset_token: { type: String, trim: true, select: false, default: null },
        password_reset_expires: { type: Date, select: false, default: null },
        password_changed_at: { type: Date, select: false, default: null },

        permissions: { type: [String], default: [] },
        role: { type: String, trim: true, enum: ["user", "admin"], default: "user" },

        otp: { type: Number, min: 100000, max: 999999, select: false, default: null },
        otp_expiry: { type: Date, index: { expires: 0 }, select: false, default: null },

        token: { type: String, select: false, default: null },
        login_otp: { type: Number, min: 100000, max: 999999, select: false, default: null },
        login_otp_expiry: { type: Date, select: false, default: null },
        last_login: { type: Date, default: null },
        login_attempts: { type: Number, default: 0, select: false },
        lock_until: { type: Date, select: false, default: null },

        active: { type: Boolean, default: true, index: true },
        createdAt: { type: Date, select: false },
        updatedAt: { type: Date, select: false }
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            virtuals: true,
            transform: function (_, ret) {
                delete ret.id;
                delete ret.__v;
                return ret;
            }
        },
        toObject: {
            virtuals: true,
            transform: function (_, ret) {
                delete ret.id;
                delete ret.__v;
                return ret;
            }
        }
    }
);


// INDEXES
userSchema.index({ email: 1, active: 1 });
userSchema.index({ role: 1, active: 1 });


// VIRTUAL
userSchema.virtual("isLocked").get(function () {
    return !!(this.lock_until && this.lock_until > new Date());
});


/* --------------------------------- METHODS -------------------------------- */
// Create & store a hashed token (returns plain token)
userSchema.methods.createLoginToken = function (signFn) {
    const plainToken = crypto.randomBytes(32).toString("hex");
    this.token = plainToken;
    const token = signFn({ id: this._id, token: plainToken });
    return token;
};

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Check if password changed after token issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.password_changed_at) {
        const changedTimestamp = parseInt(this.password_changed_at.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    };
    return false;
};

// Create Password Reset Token method
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.password_reset_token = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.password_reset_expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    return resetToken;
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = function () {
    if (this.lock_until && this.lock_until < new Date()) {
        return this.updateOne({
            $set: { login_attempts: 1 },
            $unset: { lock_until: 1 }
        });
    }

    const updates = { $inc: { login_attempts: 1 } };
    if (this.login_attempts + 1 >= 5) {
        updates.$set = { lock_until: new Date(Date.now() + 60 * 60 * 1000) };   // Lock for 1 hour
    }

    return this.updateOne(updates);
};

// Reset login attempts after successful login
userSchema.methods.resetLoginAttempts = function () {
    return this.updateOne({ $set: { login_attempts: 0 }, $unset: { lock_until: 1 } });
};


/* ------------------------------- Middleware ------------------------------- */
// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    };
});

// Update password_changed_at
userSchema.pre("save", function (next) {
    if (!this.isModified("password") || this.isNew) return next();
    this.password_changed_at = Date.now() - 1000; // Ensure token is created after password change
    next();
});

// Set default random profile image only when user is new
userSchema.pre("save", function (next) {
    if (this.isNew && !this.profile.avatar) {
        this.profile.avatar = randomProfilePicture(Math.floor(Math.random() * 1000));
    };

    next();
});

// Only generate OTP if new user or OTP is manually requested
userSchema.pre("save", function (next) {
    if (this.isNew) {
        this.otp = generateOTP();
        this.otp_expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // send verification mail
        sendMail({
            to: this.email,
            subject: `Verify your email - ${this.role === "admin" ? "Admin" : "User"} Registration`,
            html: generateEmailMessage(
                "Verify your email",
                "Thank you for registering with IconBuzzer. To complete your registration, please verify your email address using the OTP below:",
                this.first_name || "User",
                this.otp
            )
        });
    };

    next();
});


/* ------------------------------ Export Model ------------------------------ */
const User = Mongoose.model("User", userSchema);
module.exports = User;
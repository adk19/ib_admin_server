// ./src/models/category.model.js

const Mongoose = require("mongoose");
const slugify = require("slugify");


/* -------------------------- CATEGORY MODEL SCHEMA ------------------------- */
const categorySchema = new Mongoose.Schema(
    {
        name: { type: String, trim: true, required: true, unique: true, minlength: 2, maxlength: 80 },
        slug: { type: String, trim: true, unique: true, index: true },
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
categorySchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
categorySchema.index({ slug: 1 });
categorySchema.index({ active: 1 });
categorySchema.index({ createdAt: -1 });


// VIRTUAL
// Populate Subcategory
categorySchema.virtual("subCategories", {
    ref: "SubCategory",
    localField: "_id",
    foreignField: "parent"
});

// Get Public name
categorySchema.virtual("publicName").get(function () {
    if (!this.name) return "";
    return this.name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
});


/* ------------------------------- Middleware ------------------------------- */
// Auto slug on save
categorySchema.pre("save", function (next) {
    if (this.isModified("name")) this.slug = slugify(this.name, { lower: true, strict: true });
    next();
});

// Auto slug on update
categorySchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    if (update.name || (update.$set && update.$set.name)) {
        const name = update.name || update.$set.name;
        const slug = slugify(name, { lower: true, strict: true });

        if (update.$set) update.$set.slug = slug;
        else update.slug = slug;
    }
    next();
});


/* ------------------------------ Export Model ------------------------------ */
const Category = Mongoose.model("Category", categorySchema);
module.exports = Category;

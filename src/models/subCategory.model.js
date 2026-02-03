// ./src/models/subCategory.model.js

const Mongoose = require("mongoose");
const slugify = require("slugify");

/* ------------------------ SUB-CATEGORY MODEL SCHEMA ----------------------- */
const subCategorySchema = new Mongoose.Schema(
    {
        category: {
            type: Mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
            index: true
        },
        name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
        slug: { type: String, trim: true, index: true },
        description: { type: String, trim: true, maxlength: 500, default: null },
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
subCategorySchema.index(
    { category: 1, name: 1 },
    { unique: true, collation: { locale: "en", strength: 2 } }
);
subCategorySchema.index({ category: 1, slug: 1 }, { unique: true });
subCategorySchema.index({ slug: 1 });
subCategorySchema.index({ createdAt: -1 });

// VIRTUAL
// Get Public name
subCategorySchema.virtual("publicName").get(function () {
    if (!this.name) return "";
    return this.name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
});


/* ------------------------------- Middlewares ------------------------------ */
// Auto slug on save
subCategorySchema.pre("save", function (next) {
    if (this.isModified("name")) this.slug = slugify(this.name, { lower: true, strict: true });
    next();
});

// Auto slug on update
subCategorySchema.pre("findOneAndUpdate", function (next) {
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
const SubCategory = Mongoose.model("SubCategory", subCategorySchema);
module.exports = SubCategory;

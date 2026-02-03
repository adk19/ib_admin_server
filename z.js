/* -------------------------------------------------------------------------- */
/*                          src/models/ParentCategory.js                       */
/* -------------------------------------------------------------------------- */

const mongoose = require('mongoose');
const slugify = require('slugify');

const parentCategorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, unique: true, minlength: 2, maxlength: 80 },
    slug: { type: String, unique: true, index: true },
    description: { type: String, trim: true, maxlength: 500 },
    is_active: { type: Boolean, default: true, index: true },
    is_delete: { type: Boolean, default: false, index: true }
}, { timestamps: true, versionKey: false });

parentCategorySchema.pre('save', function (next) {
    if (this.isModified('name')) this.slug = slugify(this.name, { lower: true, strict: true });
    next();
});

parentCategorySchema.index({ slug: 1 });
parentCategorySchema.index({ is_active: 1, is_delete: 1 });

module.exports = mongoose.models.ParentCategory || mongoose.model('ParentCategory', parentCategorySchema);

/* -------------------------------------------------------------------------- */
/*                            src/models/SubCategory.js                        */
/* -------------------------------------------------------------------------- */

const mongoose2 = require('mongoose');
const slugify2 = require('slugify');
const subCategorySchema = new mongoose2.Schema({
    parent: { type: mongoose2.Schema.Types.ObjectId, ref: 'ParentCategory', required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    slug: { type: String, index: true },
    description: { type: String, trim: true, maxlength: 500 },
    is_active: { type: Boolean, default: true, index: true },
    is_delete: { type: Boolean, default: false, index: true }
}, { timestamps: true, versionKey: false });

subCategorySchema.pre('save', function (next) {
    if (this.isModified('name')) this.slug = slugify2(this.name, { lower: true, strict: true });
    next();
});

subCategorySchema.index({ parent: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

module.exports = mongoose2.models.SubCategory || mongoose2.model('SubCategory', subCategorySchema);

/* -------------------------------------------------------------------------- */
/*                               src/models/Icon.js                            */
/* -------------------------------------------------------------------------- */

const mongoose3 = require('mongoose');

const iconSchema = new mongoose3.Schema({
    subcategory: { type: mongoose3.Schema.Types.ObjectId, ref: 'SubCategory', required: true, index: true },
    name: { type: String, trim: true, minlength: 2, maxlength: 100, required: true },
    file: {
        original_name: { type: String, trim: true },
        ext: { type: String, trim: true, required: true },
        mimetype: { type: String, trim: true, required: true },
        size: { type: Number, required: true },
        original_url: { type: String, trim: true, match: /^https?:\/\//, required: true },
        public_url: { type: String, trim: true, match: /^https?:\/\//, required: true }
    },
    description: { type: String, trim: true, maxlength: 1000 },
    iconType: { type: String, enum: ['icon', 'illustration', 'image'], default: 'icon', index: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    access: { type: String, enum: ['free', 'premium'], default: 'free', index: true },
    likes: { type: Number, min: 0, default: 0 },
    downloaded: { type: Number, min: 0, default: 0 },
    is_active: { type: Boolean, default: true, index: true },
    is_delete: { type: Boolean, default: false, index: true },
    created_by: { type: mongoose3.Schema.Types.ObjectId, ref: 'User', required: true },
    updated_by: { type: mongoose3.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, versionKey: false, toJSON: { virtuals: true, transform(doc, ret) { delete ret.is_delete; delete ret.__v; return ret; } }, toObject: { virtuals: true, transform(doc, ret) { delete ret.is_delete; delete ret.__v; return ret; } } });

iconSchema.index({ is_active: 1, is_delete: 1, access: 1, subcategory: 1, iconType: 1 }, { name: 'active_subcat_type_index' });
iconSchema.index({ subcategory: 1, is_active: 1, is_delete: 1, access: 1, createdAt: -1 }, { name: 'subcat_recent_index' });
iconSchema.index({ name: 'text', tags: 'text', description: 'text' }, { weights: { name: 3, tags: 2, description: 1 }, name: 'search_index' });
iconSchema.index({ subcategory: 1, likes: -1, downloaded: -1, is_active: 1, is_delete: 1 }, { name: 'subcat_popularity_index' });

module.exports = mongoose3.models.Icon || mongoose3.model('Icon', iconSchema);

/* -------------------------------------------------------------------------- */
/*                         src/services/category.service.js                    */
/* -------------------------------------------------------------------------- */

const mongoose4 = require('mongoose');
const ParentCategory = require('../models/ParentCategory');
const SubCategory = require('../models/SubCategory');
const Icon = require('../models/Icon');

// Get descendant subcategory ids for a parent (BFS)
async function getSubcategoryIdsByParent(parentId) {
    const ids = [];
    const q = [parentId];
    while (q.length) {
        const p = q.shift();
        ids.push(p);
        const subs = await SubCategory.find({ parent: p }).select('_id').lean();
        subs.forEach(s => q.push(String(s._id)));
    }
    return ids;
}

async function deactivateParentAndChildren(parentId) {
    const session = await mongoose4.startSession();
    session.startTransaction();
    try {
        const subIds = await getSubcategoryIdsByParent(parentId);
        // deactivate parent
        await ParentCategory.updateOne({ _id: parentId }, { $set: { is_active: false } }, { session });
        // deactivate subcategories
        if (subIds.length) await SubCategory.updateMany({ _id: { $in: subIds } }, { $set: { is_active: false } }, { session });
        // deactivate icons under those subcategories
        await Icon.updateMany({ subcategory: { $in: subIds } }, { $set: { is_active: false } }, { session });
        await session.commitTransaction();
        session.endSession();
        return { deactivatedSubcategories: subIds.length };
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
}

// Hard delete parent -> hard delete all subcategories, soft-deactivate icons (clear subcategory, set is_active=false)
async function hardDeleteParent(parentId) {
    const session = await mongoose4.startSession();
    session.startTransaction();
    try {
        const subIds = await getSubcategoryIdsByParent(parentId);
        // update icons in bulk: previous_subcategory = subcategory, category cleared, is_active=false
        const icons = await Icon.find({ subcategory: { $in: subIds } }).session(session).select('_id subcategory').lean();
        const iconBulk = icons.map(i => ({ updateOne: { filter: { _id: i._id }, update: { $set: { is_active: false }, $unset: { subcategory: '' } } } }));
        if (iconBulk.length) await Icon.bulkWrite(iconBulk, { session });
        // delete subcategories and parent
        await SubCategory.deleteMany({ _id: { $in: subIds } }).session(session);
        await ParentCategory.deleteOne({ _id: parentId }).session(session);
        await session.commitTransaction();
        session.endSession();
        return { deletedSubcategories: subIds.length, affectedIcons: iconBulk.length };
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
}

module.exports = { getSubcategoryIdsByParent, deactivateParentAndChildren, hardDeleteParent };

/* -------------------------------------------------------------------------- */
/*                        src/controllers/category.controller.js             */
/* -------------------------------------------------------------------------- */

const ParentCategoryModel = require('../models/ParentCategory');
const SubCategoryModel = require('../models/SubCategory');
const CategoryService = require('../services/category.service');

exports.deactivateParent = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await CategoryService.deactivateParentAndChildren(id);
        return res.json({ success: true, message: 'Parent and children deactivated', result });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.hardDeleteParent = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await CategoryService.hardDeleteParent(id);
        return res.json({ success: true, message: 'Parent subtree deleted', result });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/* -------------------------------------------------------------------------- */
/*                    src/controllers/subcategory.controller.js              */
/* -------------------------------------------------------------------------- */

const SubCategory = require('../models/SubCategory');
const Icon = require('../models/Icon');

exports.createSub = async (req, res) => {
    try {
        const { parent, name, description } = req.body;
        const doc = await SubCategory.create({ parent, name, description });
        return res.status(201).json({ success: true, data: doc });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ success: false, message: 'Duplicate subcategory under parent' });
        console.error(err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.deleteSub = async (req, res) => {
    try {
        const { id } = req.params;
        // ensure no children
        const children = await SubCategory.countDocuments({ parent: id });
        if (children > 0) return res.status(400).json({ success: false, message: 'Subcategory has child categories' });
        // update icons to detach and deactivate
        const icons = await Icon.find({ subcategory: id }).select('_id');
        if (icons.length) {
            const ops = icons.map(i => ({ updateOne: { filter: { _id: i._id }, update: { $set: { is_active: false }, $unset: { subcategory: '' } } } }));
            await Icon.bulkWrite(ops);
        }
        await SubCategory.deleteOne({ _id: id });
        return res.json({ success: true, message: 'Subcategory deleted' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/* -------------------------------------------------------------------------- */
/*                         src/controllers/icon.controller.js                */
/* -------------------------------------------------------------------------- */

const IconModel = require('../models/Icon');

exports.createIcon = async (req, res) => {
    try {
        // req.body must include: subcategory, name, file.{...}, created_by
        const payload = req.body;
        const doc = await IconModel.create(payload);
        return res.status(201).json({ success: true, data: doc });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.listIconsBySubcategory = async (req, res) => {
    try {
        const { subcategory } = req.params;
        const { page = 1, limit = 20, search = '', sort = 'createdAt', order = -1 } = req.query;
        const pageNum = Math.max(1, Number(page));
        const lim = Math.min(100, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * lim;

        const filter = { subcategory, is_active: true, is_delete: false };
        if (search?.trim()) {
            filter.$text = { $search: search };
        }

        const [total, items] = await Promise.all([
            IconModel.countDocuments(filter),
            IconModel.find(filter).sort({ [sort]: Number(order) }).skip(skip).limit(lim)
        ]);

        return res.json({ success: true, page: pageNum, limit: lim, total, data: items });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/* -------------------------------------------------------------------------- */
/*                        src/validations/category.validation.js              */
/* -------------------------------------------------------------------------- */

const Joi = require('joi');

exports.createParent = {
    body: Joi.object({ name: Joi.string().trim().min(2).max(80).required(), description: Joi.string().trim().max(500).optional() })
};

exports.createSub = {
    body: Joi.object({ parent: Joi.string().hex().length(24).required(), name: Joi.string().trim().min(2).max(80).required(), description: Joi.string().trim().max(500).optional() })
};

/* -------------------------------------------------------------------------- */
/*                         src/validations/icon.validation.js                 */
/* -------------------------------------------------------------------------- */

exports.createIcon = {
    body: Joi.object({
        subcategory: Joi.string().hex().length(24).required(),
        name: Joi.string().trim().min(2).max(100).required(),
        file: Joi.object({
            original_name: Joi.string().trim().optional(),
            ext: Joi.string().trim().required(),
            mimetype: Joi.string().trim().required(),
            size: Joi.number().integer().min(1).required(),
            original_url: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
            public_url: Joi.string().uri({ scheme: ['http', 'https'] }).required()
        }).required(),
        description: Joi.string().trim().max(1000).optional(),
        iconType: Joi.string().valid('icon', 'illustration', 'image').optional(),
        tags: Joi.array().items(Joi.string().trim().min(2).max(30)).optional(),
        access: Joi.string().valid('free', 'premium').optional(),
        created_by: Joi.string().hex().length(24).required()
    })
};

/* -------------------------------------------------------------------------- */
/*                            src/middlewares/validate.js                     */
/* -------------------------------------------------------------------------- */

const validate = (schema) => (req, res, next) => {
    const toValidate = {};
    if (schema.body) toValidate.body = req.body;
    if (schema.query) toValidate.query = req.query;
    if (schema.params) toValidate.params = req.params;

    const { error, value } = (schema.validate ? schema.validate(req) : require('joi').object({}).validate(toValidate, { abortEarly: false }));

    // Note: We purposely used simple pattern above. In your app adapt to how you structure schemas.
    if (error) return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });

    // Replace values
    if (value.body) req.body = value.body;
    if (value.query) req.query = value.query;
    if (value.params) req.params = value.params;
    next();
};

module.exports = validate;

/* -------------------------------------------------------------------------- */
/*                               src/routes/category.routes.js                */
/* -------------------------------------------------------------------------- */

const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/category.controller');
const SubController = require('../controllers/subcategory.controller');
const validate2 = require('../middlewares/validate');
const CategoryValidation = require('../validations/category.validation');

router.post('/parent', validate2(CategoryValidation.createParent), CategoryController.createParent);
router.patch('/parent/:id/deactivate', CategoryController.deactivateParent);
router.delete('/parent/:id', CategoryController.hardDeleteParent);

router.post('/sub', validate2(CategoryValidation.createSub), SubController.createSub);
router.delete('/sub/:id', SubController.deleteSub);

module.exports = router;

/* -------------------------------------------------------------------------- */
/*                                 src/routes/icon.routes.js                  */
/* -------------------------------------------------------------------------- */

const express2 = require('express');
const r2 = express2.Router();
const IconController = require('../controllers/icon.controller');
const validate3 = require('../middlewares/validate');
const IconValidation = require('../validations/icon.validation');

r2.post('/', validate3(IconValidation.createIcon), IconController.createIcon);
r2.get('/sub/:subcategory', IconController.listIconsBySubcategory);

module.exports = r2;

/* -------------------------------------------------------------------------- */
/*                                    NOTES                                   */
/* -------------------------------------------------------------------------- */
// 1) Drop-in: adjust require paths if your project root differs.
// 2) Transactions require MongoDB replica set. If not available, code will still run but transactions will throw—wrap with fallback if needed.
// 3) Add authentication/authorization middleware for create/update/delete endpoints.
// 4) Add file upload handling (S3/Cloudinary) in icon controller before creating icon doc.
// 5) For performance with large category trees, consider adding `ancestors` or `materializedPath` on SubCategory for O(1) subtree queries.

// If you want, I can now:
// - Convert the validate middleware to a strict Joi middleware (plug-and-play)
// - Add controllers using your response helper functions (success(), badRequest())
// - Add unit-test skeletons (Jest)
// - Add file-upload example with multer + S3

// Tell me which of those you want next and I will generate the code.

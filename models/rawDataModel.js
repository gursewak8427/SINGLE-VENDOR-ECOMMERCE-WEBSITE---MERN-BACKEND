const mongoose = require('mongoose');

const RawDataSchema = new mongoose.Schema({
    _id: {
        type: String,
    },
    categories: [{
        // _id: String,
        categoryName: String,
        categoryIndex: String,
        categoryImage: String,
        categoryStatus: {
            type: Number,
            default: 1,
        }
    }],
    subCategories: [{
        // _id: String,
        subCategoryName: String,
        subCategoryIndex: String,
        subCategoryParent: String,
        subCategoryImage: String,
        subCategoryStatus: {
            type: Number,
            default: 1,
        }
    }]
});

module.exports = RawData = mongoose.model('rawdata', RawDataSchema);
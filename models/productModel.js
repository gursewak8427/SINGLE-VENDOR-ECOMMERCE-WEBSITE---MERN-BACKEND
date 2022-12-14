const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    // _id: {
    //     type: String,
    // },
    productName: {
        type: String,
    },
    productBrand: {
        type: String,
    },
    productParents: {
        category: {
            type: String,
        },
        subCategory: {
            type: String,
        },
    },
    ProductShortDisc: {
        type: String,
    },
    productDisc: {
        type: String,
    },
    productKeywords: {
        type: String,
    },
    productImages: [String],
    productStatus: {
        type: String,
    },
    productOverallMinPrice: {
        type: Number,
        default: 0
    },
    productOverallMaxPrice: {
        type: Number,
        default: 0
    },
    productPricing: {
        price: Number,
        mrp: Number
    },
    itemQty: {
        type: Number,
    },
    CoverImages: [String],
    productType: {
        type: String,
        default: 0
    },
    selectedVarients: [String],
    productVarients: [{
        varienteAttributes: [
            {
                attr_id: String,
                value: String,
            }
        ],
        general: {
            images: [String],
            price: Number,
            mrp: Number,
            itemQty: {
                type: Number,
                default: 0
            },
        },
        varDtl: [[String, String]]
    }],
    simpleDtl: [[String, String]],
    productReviews: [{
        userId: String,
        rate: {
            type: Number,
            default: 0
        },
        review: String
    }],
    totalRate: {
        type: Number,
        default: 0
    }
});


ProductSchema.index({ productName: "text/i" });

module.exports = Product = mongoose.model('product', ProductSchema);
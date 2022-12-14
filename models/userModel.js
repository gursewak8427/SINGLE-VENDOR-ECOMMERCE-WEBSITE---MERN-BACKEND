const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    phone: {
        type: String,
    },
    user_email: {
        type: String,
    },
    password: {
        type: String,
    },
    cart: [mongoose.Schema.Types.Mixed],
    orders: [mongoose.Schema.Types.Mixed],
    suggestProducts: [{
        pId: String,
        pName: String,
        pBrand: String,
        pParents: {
            category: String,
            subCategory: String
        },
        pPrice: Number,
        pKeywords: String,
    }],
    newNotification: {
        type: Number,
        default: 0
    },
    notifications: [String]
});

module.exports = User = mongoose.model('user', UserSchema);
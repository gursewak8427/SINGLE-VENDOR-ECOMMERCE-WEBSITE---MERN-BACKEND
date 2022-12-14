const mongoose = require('mongoose');

const AttributeSchema = new mongoose.Schema({
    // _id: {
    //     type: Number,
    // },
    attribute: {
        type: String,
    },
    values: {
        type: [String],
    },
    numProduct: {
        type: [[String]]
    }
});

module.exports = Attribute = mongoose.model('attribute', AttributeSchema);
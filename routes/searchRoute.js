const router = require('express').Router();
const url = require('url');

// Load models
const Product = require('../models/productModel');
const Attribute = require('../models/attributeModel');
const RawData = require('../models/rawDataModel');
const General = require('../models/generalModel');
const User = require('../models/userModel');

router.post('/search', async (req, res) => {
    let data
    let item = req.body.item
    let count = req.body.count
    let limit = req.body.limit
    let skip = count * limit - limit

    let sortingMethod = req.body.sortingMethod
    let priceSort
    if (sortingMethod == 3) {
        priceSortMethod = 'productOverallMinPrice'
        priceSort = 1
    }
    if (sortingMethod == 4) {
        priceSortMethod = 'productOverallMaxPrice'
        priceSort = -1
    }

    let priceRange = req.body.priceRange
    let minPrice = priceRange[0] == -1 ? 0 : parseInt(priceRange[0])
    let maxPrice = priceRange[1] == -1 ? 100000000000 : parseInt(priceRange[1])

    let filterCategory = req.body.filterCategory

    console.log(req.body)

    if (filterCategory == -1) {
        if (sortingMethod == 1) {
            data = await Product.find(
                {
                    $and: [
                        { $or: [{ 'productName': { $regex: item, $options: 'i' } }, { 'productKeywords': { $regex: item, $options: 'i' } }] },
                        { $or: [{ 'productOverallMinPrice': { $gte: minPrice, $lte: maxPrice } }, { 'productOverallMaxPrice': { $gte: minPrice, $lte: maxPrice } }] }
                    ]
                }
            ).skip(skip).limit(limit)
        } else {
            data = await Product.find(
                {
                    $or: [{ 'productName': { $regex: item, $options: 'i' } }, { 'productKeywords': { $regex: item, $options: 'i' } }],
                    $or: [{ 'productOverallMinPrice': { $gte: minPrice, $lte: maxPrice } }, { 'productOverallMaxPrice': { $gte: minPrice, $lte: maxPrice } }]
                }
            ).skip(skip).limit(limit).sort([[priceSortMethod, priceSort]])
        }
    } else {
        if (sortingMethod == 1) {
            data = await Product.find(
                {
                    $or: [{ 'productName': { $regex: item, $options: 'i' } }, { 'productKeywords': { $regex: item, $options: 'i' } }],
                    $or: [{ 'productOverallMinPrice': { $gte: minPrice, $lte: maxPrice } }, { 'productOverallMaxPrice': { $gte: minPrice, $lte: maxPrice } }]
                }
            ).where('productParents.category').equals([filterCategory]).skip(skip).limit(limit)
        } else {
            data = await Product.find(
                {
                    $or: [{ 'productName': { $regex: item, $options: 'i' } }, { 'productKeywords': { $regex: item, $options: 'i' } }],
                    $or: [{ 'productOverallMinPrice': { $gte: minPrice, $lte: maxPrice } }, { 'productOverallMaxPrice': { $gte: minPrice, $lte: maxPrice } }]
                }
            ).skip(skip).where('productParents.category').equals([filterCategory]).limit(limit).sort([[priceSortMethod, priceSort]])
        }
    }
    res.json({
        items: data
    })
})

router.post('/addToSuggestionList', async (req, res) => {
    let user = await User.findOne({ _id: req.body.userId })
    let pId = req.body.product._id
    let pName = req.body.product.productName
    let pBrand = req.body.product.productBrand
    let pPrice = req.body.product?.productOverallMaxPrice
    let pParents = req.body.product?.productParents
    let pKeywords = req.body.product?.productKeywords

    // make new suggestion
    let newSuggestion = {
        pId,
        pName,
        pBrand,
        pPrice,
        pParents,
        pKeywords,
    }
    // add new suggestion to db
    if (user.suggestProducts) {
        let notPresent = true
        user.suggestProducts.map((suggestItem, index) => {
            if (index <= 5) {
                if (suggestItem.pId == pId) {
                    user.suggestProducts[index] = newSuggestion
                    notPresent = false
                }
            }
        })
        notPresent ?
            user.suggestProducts = [newSuggestion, ...user.suggestProducts] :
            null
    } else {
        user.suggestProducts = [newSuggestion]
    }
    if (user.suggestProducts.length > 5) {
        user.suggestProducts.pop()
    }
    await user.save()
    res.json({
        message: "suggest Added Successfully"
    })
})

router.post('/getSuggestProducts', async (req, res) => {
    let user = await User.findOne({ _id: req.body.userId })
    let Suggestions = user.suggestProducts
    var finalProducts = []
    let selectedIds = []
    let _IDS = []
    let historyProducts = []

    // remove product from suggestin if the product is deleted
    var newSuggestions = Suggestions
    for (let i = 0; i < Suggestions.length; i++) {
        var productId = Suggestions[i].pId
        _IDS.push(productId) // [productId].concat(selectedIds)
        let yesProductExists = await Product.findOne({ _id: productId })
        if (!yesProductExists) {
            newSuggestions.splice(i, 1)
        } else {
            historyProducts.push(yesProductExists)
        }
    }
    console.log("#_IDS")
    console.log(_IDS)
    Suggestions = newSuggestions
    user.suggestProducts = Suggestions
    await user.save()

    // Retrive all suggestions of product for user
    for (let i = 0; i < Suggestions.length; i++) {
        if (i < 5) {
            var suggest = Suggestions[i]

            // price management
            let thisPrice = suggest.pPrice
            let range = thisPrice <= 1000 ? thisPrice / 2 : thisPrice / 1.5
            let minPrice = (thisPrice - range) >= 0 ? (thisPrice - range) : 0
            let maxPrice = thisPrice + range
            console.log([minPrice, maxPrice])
            // keyword spliting
            let keywords = []
            if (suggest.pKeywords) { keywords = suggest.pKeywords.split(',') }
            let kRegex = keywords.join('|')


            let data = await Product.find(
                {
                    '_id': { $nin: _IDS }, // $nin means "not-in" array
                    'productKeywords': { $regex: kRegex, $options: "i" },
                    // 'productBrand': { $regex: suggest.pBrand, $options: "i" },
                    $or: [
                        { 'productOverallMinPrice': { $gte: minPrice, $lte: maxPrice } },
                        { 'productOverallMaxPrice': { $gte: minPrice, $lte: maxPrice } }
                    ]
                }
            )
                .where('productParents.subCategory').equals([suggest.pParents.subCategory])
                // .where('productBrand').equals([suggest.pBrand])
                .limit(3)

            data.map(d => {
                _IDS.push(d._id)
                historyProducts.push(d)
            })

        }
    }


    console.log("#historyProducts")
    console.log(historyProducts)

    res.json({
        items: historyProducts
    })
})



router.post('/relatedProducts', async (req, res) => {
    let product = await Product.findOne({ _id: req.body.productId })
    var finalProducts = []
    let _IDS = [req.body.productId]

    console.log("#_IDS")
    console.log(_IDS)

    // Retrive all suggestions of product for user

    // price management
    if (product.productType == "0") {
        var thisPrice = product.productPricing.price
    } else {
        var thisPrice = product.productOverallMinPrice
    }

    let range = thisPrice <= 1000 ? thisPrice / 2 : thisPrice / 1.5
    let minPrice = (thisPrice - range) >= 0 ? (thisPrice - range) : 0
    let maxPrice = thisPrice + range
    console.log([minPrice, maxPrice])
    // keyword spliting
    let keywords = []
    if (product.productKeywords) { keywords = product.productKeywords.split(',') }
    let kRegex = keywords.join('|')


    let data = await Product.find(
        {
            '_id': { $nin: _IDS }, // $nin means "not-in" array
            'productKeywords': { $regex: kRegex, $options: "i" },
            // 'productBrand': { $regex: suggest.pBrand, $options: "i" },
            $or: [
                { 'productOverallMinPrice': { $gte: minPrice, $lte: maxPrice } },
                { 'productOverallMaxPrice': { $gte: minPrice, $lte: maxPrice } }
            ]
        }
    )
        .where('productParents.subCategory').equals([product.productParents.subCategory])
        // .where('productBrand').equals([suggest.pBrand])
        .limit(10)

    data.map(d => {
        _IDS.push(d._id)
        finalProducts.push(d)
    })


    console.log("#finalProducts")
    console.log(finalProducts)

    res.json({
        items: finalProducts
    })
})

module.exports = router;


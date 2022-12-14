const router = require('express').Router();
const url = require('url');

var cloudinary = require('cloudinary').v2;

// Change cloud name, API Key, and API Secret below

cloudinary.config({
  cloud_name: 'mycloud8427',
  api_key: '786139133168998',
  api_secret: 'FkXJZmDGAywRAhYPX31zykpo3VM'
});

// to delete 
// cloudinary.uploader.destroy('sample', function(result) { console.log(result) });

// Load models
const Product = require('../models/productModel');
const Attribute = require('../models/attributeModel');
const User = require('../models/userModel');
const RawData = require('../models/rawDataModel');
const General = require('../models/generalModel');


router.post('/insertProduct', async (req, res) => {
  // let general = await General.find({ _id: 1 })
  // let new_id = parseInt(general.ids.product) + 1
  new_product = new Product({
    // _id: new_id,
    productName: req.body.productName,
    productBrand: req.body.productBrand,
    productParents: req.body.parents,
    ProductShortDisc: req.body.productShortDisc,
    productDisc: req.body.productDisc,
    productKeywords: req.body.productkeywords,
    productStatus: req.body.productStatus,
  });

  var product = await new_product.save()
  res.status(201).send({
    message: 'Successfully Created Product',
    productId: product._id
  });
})
// @ only for testing this route is used..
// seed products

// request in axios
// // seedProducts
// axios.post(`${KEYS.NODE_URL}/api/vendor/product/156/seedProducts`)
//     .then(result => {
//         console.log(result.data.message)
//     }).catch(err => {
//         console.log(err)
//     })

router.post('/seedProducts', async (req, res) => {
  let products = []
  for (let i = 0; i < 100; i++) {
    let category
    let subCategory
    let image
    if (i % 2 == 0) {
      category = "60984c55752c50d85917008c"
      subCategory = "60984c6b11991bd87330cbca"
      image = 'https://i.pinimg.com/originals/c1/18/d2/c118d2a7d66952aca27ce41fefc4069d.png'
    } else {
      category = "60984c55752c50d85917008c"
      subCategory = "609903003ad16a506ba45b50"
      image = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ89pYX-w3BdMdQy_i1sKgsaK79AxmE6OFPJTJdoehzMuSQViFWWWz7ECu4JFjpp8a5uwk&usqp=CAU'
    }

    new_product = {
      // _id: new_id,
      productName: "abc" + i,
      productBrand: "brand" + i,
      productParents: {
        category,
        subCategory
      },
      productOverallMinPrice: i,
      productOverallMaxPrice: i,
      productStatus: 1,
      productPricing: {
        price: i,
        mrp: i + 1
      },
      productType: 0,
      itemQty: 10,
      CoverImages: [image]
    };
    products.push(new_product)
  }

  await Product.create(products)
  res.status(201).send({
    message: 'Successfully seed Products',
  });
})

router.post('/insertProductVarient/', async (req, res) => {
  const adr = req.url
  const q = url.parse(adr, true)
  var qdata = q.query;
  const type = qdata.type
  const productId = qdata.p_id

  var myProduct = await Product.findOne({
    _id: productId
  })

  let new_varient = req.body.varients
  for (let i = 0; i < new_varient.length; i++) {
    var mAtr = await Attribute.findOne({ _id: new_varient[i].attr_id })
    var myIndex = 0;
    mAtr.values.map((val, index) => (
      val == new_varient[i].value ? (
        myIndex = index
      ) : null
    ))
    let d = mAtr.numProduct
    d[myIndex].push(productId)
    mAtr.numProduct = d

    //  markModified .... 
    mAtr.markModified('numProduct')

    var data = await mAtr.save()
  }

  // let new_id = myProduct.productVarients.length + 1
  const newVarient = {
    varienteAttributes: new_varient,
    general: {
      price: 0,
      mrp: 0,
      images: [],
    }
  }
  myProduct.productVarients.push(newVarient);
  let updateProduct = await myProduct.save()
  res.json({
    message: 'varient added successfully',
    'myVarients': updateProduct.productVarients
  })
})

// @ get Product varients
router.post('/getProduct/', async (req, res) => {
  const adr = req.url
  const q = url.parse(adr, true)
  var qdata = q.query;
  const type = qdata.type
  const productId = qdata.p_id

  var myProduct = await Product.findOne({
    _id: productId
  })
  res.json({ myProduct })
})

router.post('/updateProductType/', async (req, res) => {
  const adr = req.url
  const q = url.parse(adr, true)
  var qdata = q.query;
  const type = qdata.type
  const productId = qdata.p_id
  const pt = req.body.pt
  var myProduct = await Product.findOne({
    _id: productId
  })
  myProduct.productType = pt

  if (pt == 0) {
    myProduct.productOverallMinPrice = myProduct.productPricing.price
    myProduct.productOverallMaxPrice = myProduct.productPricing.price
  }
  if (pt == 1) {
    let minPrice = myProduct.productVarients[0]?.general?.price
    let maxPrice = myProduct.productVarients[0]?.general?.price
    myProduct.productVarients.map(obj => {
      minPrice >= obj.general.price ? minPrice = obj.general.price : null
      maxPrice <= obj.general.price ? maxPrice = obj.general.price : null
    })
    myProduct.productOverallMinPrice = minPrice
    myProduct.productOverallMaxPrice = maxPrice
  }

  let updateProduct = await myProduct.save()
  res.json({
    message: 'product saved successfully',
    'myProduct': updateProduct
  })

})

router.post('/updateCoverImages/', async (req, res) => {
  const adr = req.url
  const q = url.parse(adr, true)
  var qdata = q.query;
  const type = qdata.type
  const productId = qdata.p_id

  var myProduct = await Product.findOne({
    _id: productId
  })
  const new_images = req.body.images
  if (myProduct.CoverImages.length >= 1) {
    let publicId = myProduct.CoverImages[0].split('/')[myProduct.CoverImages[0].split('/').length - 1].split('.')[0]
    console.log(publicId)
    let data = await cloudinary.uploader.destroy(publicId, { type: 'upload' });
    console.log('data', data)
  }
  new_images.map(img => {
    myProduct.CoverImages = [img]
  })
  let updateProduct = await myProduct.save()
  res.json({
    message: 'product saved successfully',
    'myProduct': updateProduct
  })

})

router.post('/deleteVarImage/', async (req, res) => {
  const { pId, varId, imgId } = req.body
  var myProduct = await Product.findOne({ _id: pId })
  myProduct.productVarients.map(async (varient) => {
    if (varient._id == varId) {
      let publicId = varient.general.images[imgId].split('/')[varient.general.images[imgId].split('/').length - 1].split('.')[0]
      console.log(publicId)
      let data = await cloudinary.uploader.destroy(publicId, { type: 'upload' });
      console.log('data-s', data)

      varient.general.images.splice(imgId, 1)
      var updateProduct = await myProduct.save()
      console.log('updateProduct', updateProduct.productVarients[0].general)
      res.json({
        message: 'product saved successfully',
        myProduct: updateProduct
      })
      return
    }
  })
})

router.post('/deleteVar/', async (req, res) => {
  const { pId, varId, indexx } = req.body
  var myProduct = await Product.findOne({ _id: pId })
  if (myProduct.productVarients[indexx]._id == varId) {
    myProduct.productVarients.splice(indexx, 1)
  }

  let minPrice = myProduct.productVarients[0]?.general?.price
  let maxPrice = myProduct.productVarients[0]?.general?.price
  myProduct.productVarients.map(obj => {
    minPrice >= obj.general.price ? minPrice = obj.general.price : null
    maxPrice <= obj.general.price ? maxPrice = obj.general.price : null
  })
  myProduct.productOverallMinPrice = minPrice
  myProduct.productOverallMaxPrice = maxPrice

  let updateProduct = await myProduct.save()
  res.json({
    message: 'product saved successfully',
    myProduct: updateProduct
  })
})


router.post('/deleteSimpleImage/', async (req, res) => {
  const { pId, imgId } = req.body
  var myProduct = await Product.findOne({ _id: pId })
  let publicId = myProduct.productImages[imgId].split('/')[myProduct.productImages[imgId].split('/').length - 1].split('.')[0]
  let data = await cloudinary.uploader.destroy(publicId, { type: 'upload' });
  console.log('now-data', data)
  myProduct.productImages.splice(imgId, 1)
  let updateProduct = await myProduct.save()
  res.json({
    message: 'product saved successfully',
    myProduct: updateProduct
  })
})

router.post('/updateProductVarient/', async (req, res) => {
  const adr = req.url
  const q = url.parse(adr, true)
  var qdata = q.query;
  const type = qdata.type
  const productId = qdata.p_id

  var myProduct = await Product.findOne({
    _id: productId
  })

  const pt = req.body.pt
  if (pt == 0) {
    const pricing = {
      'price': req.body.price,
      'mrp': req.body.mrp
    }
    req.body.images.map(img => (
      myProduct.productImages.push(img)
    ))
    myProduct.productOverallMinPrice = req.body.price
    myProduct.productOverallMaxPrice = req.body.price
    myProduct.productPricing = pricing
    myProduct.productType = pt
    myProduct.itemQty = req.body.simpleQty
    myProduct.simpleDtl = []
    req.body.simpleDtl.map(dtl => {
      myProduct.simpleDtl.push(dtl)
    })
    // console.log('myProduct', myProduct)
    let updateProduct = await myProduct.save()
    res.json({
      message: 'product saved successfully',
      'myProduct': updateProduct
    })
  }

  if (pt == 1) {
    const var_id = qdata.var_id
    const new_price = req.body.price
    const new_mrp = req.body.mrp
    const new_images = req.body.images
    const varDtl = req.body.varDtl
    myProduct.productVarients.map(obj => {
      if (obj._id == var_id) {
        obj.general.price = new_price
        obj.general.mrp = new_mrp
        obj.general.itemQty = req.body.varItemQty
        obj.varDtl = []
        varDtl.map(dtl => (
          obj.varDtl.push(dtl)
        ))
        new_images.map(img => {
          obj.general.images.push(img)
        })
      }
    })

    let minPrice = myProduct.productVarients[0]?.general?.price
    let maxPrice = myProduct.productVarients[0]?.general?.price
    myProduct.productVarients.map(obj => {
      minPrice >= obj.general.price ? minPrice = obj.general.price : null
      maxPrice <= obj.general.price ? maxPrice = obj.general.price : null
    })
    myProduct.productOverallMinPrice = minPrice
    myProduct.productOverallMaxPrice = maxPrice

    let updateProduct = await myProduct.save()
    res.json({
      message: 'varient added successfully',
      'myVarients': updateProduct.productVarients
    })
  }
})


// get product
// @ with categories
router.post('/product/get/category', async (req, res) => {
  let catId = req.body.category._id
  let count = req.body.count
  let limit = req.body.limit
  let skip = count * limit - limit
  let myProducts = await Product.find({ "productParents.category": catId }).skip(skip).limit(limit)
  let myRawData = await RawData.findOne({ _id: 1 })

  let FinalProduct = []

  const getCatStatus = cat => {
    let status = false
    myRawData.categories.map(c => c._id == cat ? (c.categoryStatus == 1 ? status = true : status = false) : null)
    return status
  }
  const getSubCatStatus = subCat => {
    let status = false
    myRawData.subCategories.map(sc => sc._id == subCat ? (sc.subCategoryStatus == 1 ? status = true : status = false) : null)
    return status
  }

  myProducts.map(item =>
    (item.productStatus != 0) ?
      (getCatStatus(item.productParents.category) && getSubCatStatus(item.productParents.subCategory)) ? (
        item.productType == 0 && (item.productPricing.mrp == undefined || item.productPricing.price == undefined) ?
          null : FinalProduct.push(item)
      ) : null : null
  )

  let myCollection = {
    'category': req.body.category,
    'myProducts': FinalProduct
  }
  res.json({
    myCollection
  })
})

// @ with categories
router.post('/product/get/categoryAndSubCategory', async (req, res) => {
  let catId = req.body.category._id
  let subCatId = req.body.subCategory._id

  let count = req.body.count
  let limit = req.body.limit
  let skip = count * limit - limit

  let myProducts = await Product.find({ "productParents.category": catId, "productParents.subCategory": subCatId }).skip(skip).limit(limit)
  res.json({ myProducts })

})


// @ get-product
router.post('/updateProduct', async (req, res) => {
  let product = await Product.findOne({ _id: req.body.myProduct._id })
  product.productName = req.body.myProduct.productName
  product.productBrand = req.body.myProduct.productBrand
  product.productParents = req.body.myProduct.parents
  product.ProductShortDisc = req.body.myProduct.productShortDisc
  product.productDisc = req.body.myProduct.productDisc
  product.productStatus = req.body.myProduct.productStatus
  product.productKeywords = req.body.myProduct.productKeywords

  product = await product.save()
  res.json({
    product
  })
})


// @ with id
router.post('/getProductWithID', async (req, res) => {
  let id = req.body.id
  let myProduct = await Product.findOne({ _id: id })
  if (myProduct) {
    let myCollection = myProduct
    res.json({ myCollection })
  } else {
    res.json({ myCollection: null })
  }
})

// attrubute querries
// @ insert 
router.post('/insertAttribute/', async (req, res) => {
  // let new_id = await Attribute.findOne().limit(1).sort({ $natural: -1 })
  // if (new_id) {
  //   new_id = new_id._id + 1
  // } else {
  //   new_id = 1
  // }
  // let new_id = await Attribute.countDocuments()
  // new_id += 1
  let new_values = req.body.values.split(',')
  let i = 0
  while (i < new_values.length) {
    new_values[i] = new_values[i].trim()
    i += 1
  }
  let aa = []
  new_values.map(v => (
    aa.push([])
  ))
  const newAttr = {
    // _id: new_id,
    attribute: req.body.attribute,
    values: new_values,
    numProduct: aa
  }
  await Attribute.create(newAttr)
  let myAttributes = await Attribute.find()
  res.json({
    message: 'Attribute added successfully',
    myAttributes
  })
})
// @ get 
router.get('/getAttribute/', async (req, res) => {
  let myAttributes = await Attribute.find()
  res.json({
    message: 'Attribute added successfully',
    myAttributes
  })
})


router.post('/getAttributeWithId/', async (req, res) => {
  let myAttribute = await Attribute.findOne({ _id: req.body.id })
  res.json({
    myAttribute
  })
})

router.post('/setAttributes/', async (req, res) => {
  let newV = req.body.attribute
  let myAttribute = await Attribute.findOne({ _id: req.body.id })
  myAttribute.values = newV.values
  myAttribute.numProduct = newV.numProduct
  await myAttribute.save()
  let data = await Attribute.find()
  res.json({
    myAttribute: data
  })
})

// @ set selected varients
router.post('/setSelectedVarients/', async (req, res) => {
  const { pId, selectedVarients } = req.body
  let myProduct = await Product.findOne({ _id: pId })
  myProduct.selectedVarients = selectedVarients
  await myProduct.save()
  res.json({
    message: 'saved successfully'
  })
})

// @ get selected varients
router.post('/getSelectedVarients/', async (req, res) => {
  const { pId } = req.body
  let myProduct = await Product.findOne({ _id: pId })
  res.json({
    selectedVarients: myProduct.selectedVarients
  })
})

// @ delete 
router.post('/deleteAttribute/', async (req, res) => {
  let myAttributes = await Attribute.findOne({ _id: req.body.id })

  var error = []
  myAttributes.numProduct.map((num, index) => (
    num.length != 0 ? (
      error.push([myAttributes.values[index], num])
    ) : null
  ))
  if (error != '') {
    res.json({ error })
    return
  } else {
    let myAttributes = await Attribute.findByIdAndRemove({ _id: req.body.id })
  }
  let data = await Attribute.find()
  res.json({
    message: 'Attribute deleted successfully',
    myAttributes: data
  })
})


router.post('/pushNewAttribute/', async (req, res) => {
  var myAttributes = await Attribute.findOne({ _id: req.body.id })
  if (myAttributes.values.includes(req.body.value)) {
    res.json({
      myAttributes: 0
    })
  }
  myAttributes.values.push(req.body.value)
  myAttributes.numProduct.push([])
  await myAttributes.save()
  let data = await Attribute.find()
  res.json({
    message: 'Attribute deleted successfully',
    myAttributes: data
  })
})


// category management
// @ add category

router.post('/insertCategory/', async (req, res) => {
  let myRawData = await RawData.findOne({ _id: 1 })
  var indexing = 0
  if (myRawData != null) {
    // let newCatId = myRawData.categories.length + 1
    myRawData.categories.map(cat => (
      cat.categoryIndex > indexing ? indexing = cat.categoryIndex : null
    ))
    indexing = parseInt(indexing)
    indexing += 1
    const newCat = {
      // _id: newCatId,
      categoryName: req.body.newCategoryName,
      categoryIndex: indexing,
      categoryImage: req.body.images[0]
    }
    myRawData.categories.push(newCat)
    let updateRawData = await myRawData.save()
    res.json({
      message: 'Categories Updated successfully added successfully',
      myCategories: updateRawData.categories
    })
  }
  else {
    indexing += 1
    const newCat = {
      _id: 1,
      categories: [{
        // _id: 1,
        categoryName: req.body.newCategoryName,
        categoryIndex: indexing,
        categoryImage: req.body.images[0]
      }],
      subCategories: []
    }
    let updateRawData = await RawData.create(newCat)
    res.json({
      message: 'Category added successfully added successfully',
      myCategories: updateRawData.categories
    })
  }
})

router.get('/getCategories/', async (req, res) => {
  let myRawData = await RawData.findOne({ _id: 1 })
  if (myRawData) {
    let myCategories = myRawData.categories
    res.json({
      myCategories
    })
  } else {
    res.json({
      myCategories: []
    })
  }
})

router.get('/getRawData/', async (req, res) => {
  let myRawData = await RawData.findOne({ _id: 1 })
  if (myRawData) {
    res.json({
      myRawData
    })
  } else {
    res.json({
      myRawData: []
    })
  }
})

router.post('/setCategoryIndex', async (req, res) => {
  let categories = req.body.categories
  let myRawData = await RawData.findOne({ _id: 1 })
  myRawData.categories = categories
  let updateRawData = await myRawData.save()
  res.json({
    myCategories: updateRawData.categories
  })
})

router.post('/setCategoryStatus', async (req, res) => {
  let myRawData = await RawData.findOne({ _id: 1 })
  myRawData.categories[req.body.index].categoryStatus = req.body.status
  let updateRawData = await myRawData.save()
  res.json({
    myCategories: updateRawData.categories
  })
})

router.post('/setSubCategoryIndex', async (req, res) => {
  let subCategories = req.body.subCategories
  let myRawData = await RawData.findOne({ _id: 1 })
  myRawData.subCategories = subCategories
  let updateRawData = await myRawData.save()
  res.json({
    mySubCategories: updateRawData.subCategories
  })
})

router.post('/setSubCategoryStatus', async (req, res) => {
  let myRawData = await RawData.findOne({ _id: 1 })
  myRawData.subCategories.map(sc => sc._id == req.body.id ? sc.subCategoryStatus = req.body.status : null)
  let updateRawData = await myRawData.save()
  res.json({
    mySubCategories: updateRawData.subCategories
  })
})


router.post('/insertSubCategory/', async (req, res) => {
  let myRawData = await RawData.findOne({ _id: 1 })
  // let newSubCatId = myRawData.subCategories.length + 1

  var indexing = 0
  myRawData.subCategories.map(subCat => (
    subCat.subCategoryParent == req.body.parent ? (
      subCat.subCategoryIndex > indexing ? indexing = subCat.subCategoryIndex : null
    ) : null
  ))
  indexing = parseInt(indexing)
  indexing += 1

  const newCat = {
    // _id: newSubCatId,
    subCategoryParent: req.body.parent,
    subCategoryName: req.body.newSubCategoryName,
    subCategoryIndex: indexing,
    subCategoryImage: req.body.images[0]
  }

  myRawData.subCategories.push(newCat)
  await myRawData.save()

  let mySubCategories = []
  myRawData.subCategories.map(subCat => subCat.subCategoryParent == req.body.parent ? mySubCategories.push(subCat) : null)

  res.json({
    message: 'Sub Categories Updated successfully added successfully',
    mySubCategories
  })
})


router.get('/getSubCategories/', async (req, res) => {
  const adr = req.url
  const q = url.parse(adr, true)
  var qdata = q.query;
  const parent = qdata.parent

  let myRawData = await RawData.findOne({ _id: 1 })
  if (myRawData) {
    let mySubCategories = []
    myRawData.subCategories.map(subCat => subCat.subCategoryParent == parent ? mySubCategories.push(subCat) : null)
    res.json({
      mySubCategories
    })
  } else {
    res.json({
      mySubCategories: []
    })
  }
})


// @ getItemQuantity

router.post('/getQty/', async (req, res) => {
  const adr = req.url
  const q = url.parse(adr, true)
  var qdata = q.query;
  const type = qdata.type
  const productId = qdata.p_id

  // p_id and pt
  var myProduct = await Product.findOne({
    _id: productId
  })

  const pt = req.body.pt
  if (pt == 0) {
    res.json({
      qty: myProduct.itemQty
    })
    return
  }
  const var_id = qdata.var_id
  if ((pt == 1) && (var_id != 0)) {
    myProduct.productVarients.map(obj => {
      if (obj._id == var_id) {
        res.json({
          qty: obj.general.itemQty
        })
      }
    })
  }

})

router.post('/setQty/', async (req, res) => {
  const adr = req.url
  const q = url.parse(adr, true)
  var qdata = q.query;
  const type = qdata.type
  const productId = qdata.p_id

  // p_id and pt
  var myProduct = await Product.findOne({
    _id: productId
  })

  const pt = req.body.pt
  if (pt == 0) {
    myProduct.itemQty = myProduct.itemQty - req.body.qty
    await myProduct.save()
    res.json({
      message: "success"
    })
    return
  }
  const var_id = qdata.var_id
  if ((pt == 1) && (var_id != 0)) {
    myProduct.productVarients.map(obj => {
      if (obj._id == var_id) {
        obj.general.itemQty = obj.general.itemQty - req.body.qty
      }
    })
  }
  await myProduct.save()
  res.json({
    message: "success"
  })
})

// @ delete 
router.post('/deleteProduct/', async (req, res) => {

  // p_id and pt
  var myProduct = await Product.findOne({
    _id: req.body.id
  })

  if (myProduct.CoverImages.length >= 1) {
    let publicId = myProduct.CoverImages[0].split('/')[myProduct.CoverImages[0].split('/').length - 1].split('.')[0]
    await cloudinary.uploader.destroy(publicId, { type: 'upload' });
  }

  myProduct.productVarients.map(async (varient) => {
    varient.general.images.map(async (imgg) => {
      let publicId = imgg.split('/')[imgg.split('/').length - 1].split('.')[0]
      await cloudinary.uploader.destroy(publicId, { type: 'upload' });
    })
  })

  for (let j = 0; j < myProduct.productVarients.length; j++) {
    for (let i = 0; i < myProduct.productVarients[j].varienteAttributes.length; i++) {
      var mAtr = await Attribute.findOne({ _id: myProduct.productVarients[j].varienteAttributes[i].attr_id })
      var myIndex = -1;
      mAtr.values.map((val, index) => (
        val == myProduct.productVarients[j].varienteAttributes[i].value ? (
          myIndex = index
        ) : null
      ))
      if (myIndex != -1) {
        let d = mAtr.numProduct
        d[myIndex].splice(myIndex, 1)
        mAtr.numProduct = d
      }
      //  markModified .... 
      mAtr.markModified('numProduct')
      var data = await mAtr.save()
    }
  }

  await Product.findByIdAndRemove({ _id: req.body.id })
  res.json({
    message: 'Product deleted successfully',
  })
})


router.post('/deleteCategory', async (req, res) => {
  let catIndex = req.body.index
  let catId = req.body.catId

  let myRawData = await RawData.findOne({ _id: 1 })
  myRawData.categories[catIndex]._id == catId ? (
    myRawData.categories.splice(catIndex, 1)
  ) : null

  let sCat = myRawData.subCategories
  sCat.map((sc, i) => {
    sc.subCategoryParent == catId ? myRawData.subCategories.splice(i, 1) : null
  })
  await myRawData.save()
  await Product.deleteMany({ "productParents.category": catId })
  await User.findOne({})

  res.json({
    message: "success"
  })
})

router.post('/deleteSubCategory', async (req, res) => {
  let subCatIndex = req.body.index
  let subCatId = req.body.subCatId

  let myRawData = await RawData.findOne({ _id: 1 })
  myRawData.subCategories[subCatIndex]._id == subCatId ? (
    myRawData.subCategories.splice(subCatIndex, 1)
  ) : null

  await myRawData.save()
  await Product.deleteMany({ "productParents.subCategory": subCatId })
  res.json({
    message: "success"
  })
})

module.exports = router;

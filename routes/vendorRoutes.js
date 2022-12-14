const router = require('express').Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Load models
const Vendor = require('../models/vendorModel');
const General = require('../models/generalModel');

router.post('/signup', async (req, res) => {
  // req.body = {
  //   name: "admin",
  //   phone: "0123456789",
  //   password: "admin"
  // }
  return res.status(400).json({
    error: "Vendor Not Create. There is only one vendor required"
  });
  let vendor = await Vendor.findOne({
    phone: req.body.phone
  });
  if (vendor) return res.status(400).json({
    error: "Vendor Already Exists"
  });

  let new_id = await Vendor.countDocuments()
  new_id += 1

  vendor = new Vendor({
    _id: new_id,
    name: req.body.name,
    phone: req.body.phone,
    password: req.body.password
  });

  const salt = await bcrypt.genSalt(10);
  vendor.password = await bcrypt.hash(vendor.password, salt);
  vendor = await vendor.save();

  res.status(201).send({
    name: vendor.name,
    email: vendor.email
  });

});

router.post('/signin', async (req, res) => {
  let vendor = await Vendor.findOne({
    phone: req.body.phone
  });
  if (vendor) {
    bcrypt.compare(req.body.password, vendor.password, (err, result) => {
      if (err) {
        return res.status(400).json({
          error: 'Something went wrong in password hashing'
        })
      } else if (result) {
        const token = jwt.sign(
          { id: vendor._id, name: vendor.name, phone: vendor.phone },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );
        res.json({
          token,
          user: {
            id: vendor._id,
            name: vendor.name,
            phone: vendor.phone
          }
        });
      }
      else {
        return res.status(400).json({
          error: 'Passwords don\'t match'
        })
      }
    })
  } else {
    return res.status(400).json({
      error: "Vendor Not Exist with ths Number"
    });
  }
});

router.post('/getVendor', async (req, res) => {
  let vendor = await Vendor.findOne({_id: 1})
  let general = await General.findOne({_id: 1})
  res.json({
    name: vendor.name,
    phone: vendor.phone,
    cod: general?.CodPaymentOption
  })
})

router.post('/update/name', async (req, res) => {
  const name = req.body.name
  let vendor = await Vendor.findOne({_id: 1})
  vendor.name = name
  await vendor.save()
  res.json({
    messaage: "done"
  })
})


router.post('/update/number', async (req, res) => {
  const number = req.body.number
  let vendor = await Vendor.findOne({_id: 1})
  vendor.phone = number
  await vendor.save()
  res.json({
    messaage: "done"
  })
})


router.post('/toggleCOD', async (req, res) => {
  let general = await General.findOne({_id: 1})
  if(general.CodPaymentOption){
    general.CodPaymentOption = false
  }else{
    general.CodPaymentOption = true
  }
  await general.save()
  res.json({
    cod : general.CodPaymentOption
  })
})

router.post('/getCOD', async (req, res) => {
  let general = await General.findOne({_id: 1})
  res.json({
    cod : general.CodPaymentOption
  })
})

router.post('/checkPassword', async (req, res) => {
  const { password } = req.body
  var vendor = await Vendor.findOne({ _id: 1 })
  if (vendor) {
      bcrypt.compare(password, vendor.password, (err, result) => {
          if (err) {
              return res.status(400).json({
                  error: 'Something went wrong in password hashing'
              })
          } else if (result) {
              return res.json({
                  message: 'Successfully Validate Password'
              })
          }
          else {
              return res.status(400).json({
                  error: 'Passwords don\'t match'
              })
          }
      })
  }
})


router.post('/updatePassword', async (req, res) => {
  const { password } = req.body
  var vendor = await Vendor.findOne({ _id: 1 })
  if (vendor) {
      vendor.password = password
      const salt = await bcrypt.genSalt(10);
      vendor.password = await bcrypt.hash(vendor.password, salt);
      vendor = await vendor.save();
      return res.json({
          message: "Password Updated Successfull"
      })
  }
})


router.post('/checkAdminToken', async (req, res) => {
  console.log(req.body)
  res.send();
})

module.exports = router;
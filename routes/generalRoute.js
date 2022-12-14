const router = require('express').Router();
const url = require('url');

var cloudinary = require('cloudinary').v2;

// Change cloud name, API Key, and API Secret below

cloudinary.config({
    cloud_name: 'mycloud8427',
    api_key: '786139133168998',
    api_secret: 'FkXJZmDGAywRAhYPX31zykpo3VM'
});

// Load models
const General = require('../models/generalModel');

// slider
router.post('/insertSlider/', async (req, res) => {
    let myData = await General.findOne()
    if (myData) {
        let index = 1
        myData.mainSlider.map(slide => slide.index >= index ? index += 1 : null)

        var newSlider = {
            name: req.body.name,
            link: req.body.link,
            image: req.body.img,
            index
        }

        myData.mainSlider.push(newSlider)
        let finalData = await myData.save()
        res.json({
            finalData
        })
    } else {
        var newData = {
            _id: 1,
            CodPaymentOption: false,
            mainSlider: [
                {
                    name: req.body.name,
                    link: req.body.link,
                    image: req.body.img,
                    index: 1
                }
            ]
        }
        let finalData = await General.create(newData)
        res.json({
            finalData
        })
    }
})

router.get('/getSlider/', async (req, res) => {
    let myData = await General.findOne()
    if (myData) {
        res.json({
            finalData: myData.mainSlider
        })
    } else {
        res.json({
            finalData: []
        })
    }
})

router.post('/updateSlider/', async (req, res) => {
    let myData = await General.findOne()
    index = req.body.index
    if (myData) {
        myData.mainSlider[index].name = req.body.name
        myData.mainSlider[index].link = req.body.link

        // distroy images
        myData.mainSlider[index].image.map(async (img) => {
            let publicId = img.split('/')[img.split('/').length - 1].split('.')[0]
            await cloudinary.uploader.destroy(publicId, { type: 'upload' });
        })

        if (req.body.img.length != 0) {
            myData.mainSlider[index].image = req.body.img
        }

        let finalData = await myData.save()
        res.json({
            finalData
        })
    }
})

router.post('/deleteSlider/', async (req, res) => {
    let myData = await General.findOne()
    index = req.body.index
    if (myData) {
        // distroy images
        myData.mainSlider[index].image.map(async (img) => {
            let publicId = img.split('/')[img.split('/').length - 1].split('.')[0]
            await cloudinary.uploader.destroy(publicId, { type: 'upload' });
        })
        myData.mainSlider.splice(index, 1)
        let finalData = await myData.save()
        res.json({
            finalData
        })
    }
})

module.exports = router;
const nodemailer = require("nodemailer");
const puppeteer = require('puppeteer');
const handlebars = require("handlebars");

var fs = require('fs');
var path = require('path');
const url = require('url');

const ORDER_PLACED_FOR_USER = "ORDER_PLACED_FOR_USER" // "order placed by user"
const ORDER_PLACED_FOR_VENDOR = "ORDER_PLACED_FOR_VENDOR" // "order placed by vendor"
const ORDER_PENDING = "ORDER_PENDING" // "order pending again start by vendor"
const ORDER_PROCESSING = "ORDER_PROCESSING" // "order processing start by vendor"
const ORDER_SHIPPING = "ORDER_SHIPPING" // "order is going to shipping by vendor"
const ORDER_CANCELED = "ORDER_CANCELED" // "order canceled by vendor"
const ORDER_DELIVERED = "ORDER_DELIVERED" // "order successfully delivered by vendor"


// sir live keys
// const stripe = require('stripe')("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") // secret key of stripe

class Webpage {
    static async generatePDF(url) {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }); // Puppeteer can only generate pdf in headless mode.
        const page = await browser.newPage();

        await page.setDefaultNavigationTimeout(0);

        await page.goto(url, { waitUntil: 'networkidle0' }); // Adjust network idle as required. 

        // await page.waitForNavigation({
        //     waitUntil: 'networkidle0',
        // });

        await page.waitForSelector('#totalCost', {
            visible: true,
        });

        const pdfConfig = {
            format: 'A4',
            printBackground: true,
            margin: { // Word's default A4 margins
                top: '2.54cm',
                bottom: '2.54cm',
                left: '2.54cm',
                right: '2.54cm'
            }
        };
        // await page.emulateMedia('screen');
        const pdf = await page.pdf(pdfConfig); // Return the pdf buffer. Useful for saving the file not to disk. 

        await browser.close();
        console.log("Browser closing...")
        return pdf;
    }
}

class Email {
    static sendEmailWithFile(to, subject, text, filename, fileContent) {
        console.log("im here for mail with file")
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'gursewaksaggu23@gmail.com',
                pass: 'tudmyiwdnvzxjonk',
            }
        });

        const mailOptions = {
            from: 'gursewaksaggu23@gmail.com', // vendor email
            to: to,
            subject: subject,
            text: text,
            attachments: [{
                filename: filename,
                content: fileContent
            }]
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }

            console.log('Message sent: %s', info.messageId);
        });
    }

    static sendEmailWithoutFile(to, subject, text) {
        console.log("im here for mail 232")
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'gursewaksaggu23@gmail.com',
                pass: 'tudmyiwdnvzxjonk',
            }
        });

        const mailOptions = {
            from: 'gursewaksaggu23@gmail.com', // vendor email
            to: to,
            subject: subject,
            text: text,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("#error");
                return console.log(error);
            }

            console.log('Message sent without file : %s', info.messageId);
        });
    }
}

async function sendEmail(req, type, person, order, orderIndex) {
    const baseurl = url.format({
        protocol: req.protocol,
        host: req.get('host'),
    });

    if (type == ORDER_PLACED_FOR_USER) {
        var toEmail = person.user_email;
        var subject = "New Order Placed Successfully at " + order.orderTime[0] + " | Style Factory"
        var text = "Thanks for order (ORDER ID : " + order.orderId + "). Check your order detail at following link : \nhttps://single-vendor-ecommerce-website-mern.vercel.app/orders"
        Email.sendEmailWithoutFile(toEmail, subject, text)
    } else if (type == ORDER_PROCESSING) {
        var toEmail = person.user_email;
        var subject = "Your Order (" + order.orderId + ") Update" + " | Style Factory"
        var text = "Status : Processing. \nCheck your order detail at following link : \nhttps://single-vendor-ecommerce-website-mern.vercel.app/orders"
        Email.sendEmailWithoutFile(toEmail, subject, text)
    } else if (type == ORDER_SHIPPING) {
        var toEmail = person.user_email;
        var subject = "Your Order (" + order.orderId + ") Update" + " | Style Factory"
        var text = "Status : Shipping. \nCheck your order detail at following link : \nhttps://single-vendor-ecommerce-website-mern.vercel.app/orders"
        Email.sendEmailWithoutFile(toEmail, subject, text)
    } else if (type == ORDER_CANCELED) {
        var toEmail = person.user_email;
        var subject = "Sorry! Your Order (" + order.orderId + ") is canceled from Stylefactory" + " | Style Factory"
        var text = "Check your order detail at following link : \nhttps://single-vendor-ecommerce-website-mern.vercel.app/orders"
        Email.sendEmailWithoutFile(toEmail, subject, text)
    } else if (type == ORDER_PENDING) {
        var toEmail = person.user_email;
        var subject = "Your Order (" + order.orderId + ") Update" + " | Style Factory"
        var text = "Status : Pending. \nSorry! Due to internal problem, your order is again set to pending. We'll process your order withing 1-2 business days \nCheck your order detail at following link : \nhttps://single-vendor-ecommerce-website-mern.vercel.app/orders"
        Email.sendEmailWithoutFile(toEmail, subject, text)
    } else if (type == ORDER_DELIVERED) {
        var toEmail = person.user_email;
        var subject = "Your Order (" + order.orderId + ") Delivered" + " | Style Factory"
        var text = "Status : Delivered. \n Check your order detail at following link : \nhttps://single-vendor-ecommerce-website-mern.vercel.app/orders"

        // Send Order Delivered Email with Bill at Email
        const url = baseurl + `/files/invoice.html?orderIndex=${orderIndex}&baseurl=${baseurl}`

        console.log("url")
        console.log(url)

        try {
            const buffer = await Webpage.generatePDF(url);

            Email.sendEmailWithFile(toEmail, subject, text, 'style_factory_bill.pdf',
                buffer)
        } catch (error) {
            console.log("Generating pdf error")
            console.log(error)
        }
    }
    return { status: "1", message: "Email Send Successfully", url };
    // var data = req.body
    // let date_ob = new Date();
    // let date = ("0" + date_ob.getDate()).slice(-2);
    // let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    // let year = date_ob.getFullYear();
    // let hours = date_ob.getHours();
    // let minutes = date_ob.getMinutes();
    // let seconds = date_ob.getSeconds();
    // var nowDate = year + "-" + month + "-" + date;
    // var nowTime = hours + ":" + minutes;

    // const orderId = req.body.orderInfo.orderId
    // const paymentId = req.body.orderInfo.paymentId
    // const payment_status = req.body.orderInfo.payment_status

    // // find order with id
    // var current_order = await Order.findOne({ "basicInfo.order_id": orderId })
    // current_order.basicInfo.payment_id = paymentId
    // current_order.basicInfo.payment_status = payment_status

    // current_order = await current_order.save();

    // // find user with id
    // const current_user = await User.findOne({ _id: req.userData.id })
    // const toEmail = current_user.email


    // // find product with id
    // const current_product = await Product.findOne({ "_id": current_order.productInfo.p_id })


    try {
        // const billingInfo = current_order.billingInfo;
        // const shippingInfo = current_order.shippingInfo;
        // const productInfo = current_order.productInfo;

        (async () => {

            // var orderDate = current_order.basicInfo.date.toString();
            // var orderNumber = current_order.basicInfo.order_id.toString();
            // var transactionId = current_order.basicInfo.payment_id.toString()
            // var paymentSource = 'card'
            // var userName = billingInfo.b_firstname.toString()
            // var userEmail = billingInfo.b_email.toString()

            // var billingAddress = `${billingInfo.b_street}, ${billingInfo.b_city}, ${billingInfo.b_state} - ${billingInfo.b_zip}`

            // var shippingAddress = `${shippingInfo.s_street}, ${shippingInfo.s_city}, ${shippingInfo.s_state} - ${shippingInfo.s_zip}`

            // var deliveryMethod = 'Pickup'
            // var productName = current_product.productName
            // var productQty = productInfo.p_qty
            // var productUnitPrice = productInfo.p_price.price
            // var productTotalPrice = productQty * productUnitPrice
            // var discountedPrice = productInfo.p_discount * productQty
            // var totalWithoutHst = productTotalPrice - productInfo.p_discount * productQty
            // var hstAmount = 13 * totalWithoutHst / 100
            // var subTotal = totalWithoutHst + hstAmount
            // var productModel = productInfo.p_model

            // const url = baseurl + '/invoice/' + `invoice.html?orderDate=${orderDate}&orderNumber=${orderNumber}&transactionId=${transactionId}&paymentSource=${paymentSource}&userName=${userName}&userEmail=${userEmail}&billingAddress=${billingAddress}&shippingAddress=${shippingAddress}&deliveryMethod=${deliveryMethod}&productName=${productName}&productQty=${productQty}&productUnitPrice=${productUnitPrice}&productTotalPrice=${productTotalPrice}&totalWithoutHst=${totalWithoutHst}&hstAmount=${hstAmount}&subTotal=${subTotal}&discountedPrice=${discountedPrice}&productModel=${productModel}`

            // console.log("url")
            // console.log(url)

            // const buffer = await Webpage.generatePDF(url);

            // Email.sendEmail(
            //     toEmail, // Update to email
            //     'Invoice',
            //     'I thought you might enjoy this invoice!',
            //     'Invoice_prismonic.pdf',
            //     buffer);

            // Email.sendEmail(
            //     "prismonic.info@gmail.com", // Update to email
            //     `Order from p-signs | Model : ${productInfo.p_model} | User : ${userName}`,
            //     "One Digital Graphic Sign's order from p-signs.ca",
            //     `order_detail_${orderId}.pdf`,
            //     buffer);

        })();

        return { status: "1", message: "Email Send Successfully" };
    } catch (error) {
        console.log("Email Error")
        console.log(error.message)
        return { status: "0", message: "Email Send Failed" };
    }
}

module.exports = sendEmail






const nodemailer = require('nodemailer');

const sendMail = (from,to,subject,text,html,callback) => {
    // Send Mail
    nodemailer.createTestAccount((err, account) => {
        let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com", port: 465, secure: true, // true for 465, false for other ports
        auth: {
            user: "support@turftown.in", // generated ethereal user
            pass: "kopsupport" // generated ethereal password
        }
        });

        // setup email data with unicode symbols
        let mailOptions = {
        from: '<'+from+'>', // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        text: text , // plain text body
        html: html // html body
        };

        transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
            callback(false);

        }
            console.log(info)
            callback(true);
        });
    });
}

module.exports = sendMail

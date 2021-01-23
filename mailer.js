const nodemailer = require('nodemailer')
function enviar(to, text) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'nodemailerADL@gmail.com',
            pass: 'desafiolatam',
        },
    })
    let mailOptions = {
        from: 'nodemailerADL@gmail.com',
        to,
        subject: 'nasa',
        html: text,
    }
    transporter.sendMail(mailOptions, (err, data) => {
    if (err) console.log(err)
    if (data) console.log(data)
    })
    }
module.exports = enviar
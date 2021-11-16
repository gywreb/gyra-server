const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const { ErrorResponse } = require("../models/ErrorResponse");

exports.EmailService = class EmailService {
  static init() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
      },
    });
    return this;
  }
  static async sendInvitation(
    sender,
    receiver,
    email,
    subject,
    message,
    targetUrl,
    next
  ) {
    try {
      this.transporter.use(
        "compile",
        hbs({
          viewEngine: {
            extname: "handlebars",
            layoutsDir: "views/",
            defaultLayout: "index",
          },
          viewPath: "views/",
        })
      );
      return await this.transporter.sendMail({
        from: `${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`,
        to: email,
        subject,
        text: message,
        template: "index",
        context: {
          sender,
          receiver,
          message,
          targetUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }
};

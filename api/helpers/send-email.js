const nodemailer = require('nodemailer');

module.exports = {
  friendlyName: 'Send email',

  description: 'Send an email using nodemailer with support for HTML, attachments, CC, and BCC.',

  inputs: {
    to: { type: 'string', required: true },
    subject: { type: 'string', required: true },
    text: { type: 'string' }, // Optional if HTML is provided
    html: { type: 'string' }, // Optional if text is provided
    cc: { type: 'ref', defaultsTo: undefined }, // Can be string or array
    bcc: { type: 'ref', defaultsTo: undefined },
    attachments: {
      type: 'ref', // Expecting array of { filename, path | content }
      defaultsTo: []
    },
  },

  fn: async function (inputs, exits) {
    try {
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: inputs.to,
        subject: inputs.subject,
        text: inputs.text || undefined,
        html: inputs.html || undefined,
        cc: inputs.cc,
        bcc: inputs.bcc,
        attachments: inputs.attachments,
      };

      const info = await transporter.sendMail(mailOptions);

      sails.log.debug('Email sent:', info.response);
      return exits.success(info);
    } catch (err) {
      sails.log.error('Failed to send email:', err);
      return exits.error(new Error('Failed to send email.'));
    }
  }
};

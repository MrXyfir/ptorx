const chargeUser = require('lib/user/charge');
const MailGun = require('mailgun-js');
const config = require('config');
const MySQL = require('lib/mysql');

/*
  POST /api/receive/reply
  REQUIRED
    sender: string, // Always 'user@domain'
    subject: string,
    recipient: string, // 'message_id--reply@ptorx-domain'
    body-plain: string,
  OPTIONAL
    body-html: string
  RETURNS
    HTTP STATUS - 200: Success, 406: Error
  DESCRIPTION
    Reply from a proxy address to the message's original sender
*/
module.exports = async function(req, res) {
  const db = new MySQL();

  try {
    const [messageId, domain] = req.body.recipient.split('--reply@');

    await db.getConnection();
    const [row] = await db.query(
      `
        SELECT
          m.sender AS originalSender, pxe.user_id AS userId,
          CONCAT(pxe.address, '@', d.domain) AS proxyAddress
        FROM
          messages AS m, domains AS d, proxy_emails AS pxe
        WHERE
          m.id = ? AND
          pxe.email_id = m.email_id AND
          d.id = pxe.domain_id
      `,
      [messageId]
    );

    await chargeUser(db, row.userId, 2);
    db.release();

    const mailgun = MailGun({
      apiKey: config.keys.mailgun,
      domain
    });

    // Notify sender that the message cannot be replied to
    if (!row) {
      await mailgun.messages().send({
        subject: req.body.subject,
        text:
          'The message linked to this `Reply-To` address is either expired ' +
          'or for some other reason cannot be found on Ptorx. You will not ' +
          'be able to reply to it. Please start a new conversation with the ' +
          'original sender using the Ptorx app.',
        from: req.body.recipient,
        to: req.body.sender
      });
    }
    // Send reply
    else {
      await mailgun.messages().send({
        subject: req.body.subject,
        text: req.body['body-plain'],
        from: row.proxyAddress,
        html: req.body['body-html'] || '',
        to: row.originalSender
      });
    }

    res.status(200).send();
  } catch (err) {
    db.release();
    res.status(406).send();
  }
};
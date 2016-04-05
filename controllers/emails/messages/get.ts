﻿import request = require("request");
import db = require("../../../lib/db");

let config  = require("../../../config");
let mailgun = require("mailgun-js")({
    api_key: config.keys.mailgun, domain: "mail.ptorx.com"
});

/*
    GET api/emails/:email/messages/:message
    RETURN
        {
            error: boolean, headers?: [{ header: string, value: string }],
            from?: string, subject?: string, text?: string, html?: string
        }
    DESCRIPTION
        Return message content
*/
export = function (req, res) {
    
    let sql: string = `
        SELECT message_key as mkey FROM messages WHERE message_id = ? AND email_id IN (
            SELECT email_id FROM redirect_emails WHERE email_id = ? AND user_id = ?
        ) AND received + 255600 > UNIX_TIMESTAMP()
    `;

    db(cn => cn.query(sql, [req.params.email, req.sesion.uid], (err, rows) => {
        cn.release();

        if (err || !rows.length) {
            res.json({ error: true });
        }
        else {
            mailgun.messages(rows[0].mkey).info((err, data) => {
                res.json({
                    error: false, headers: data["message-headers"], from: data["from"],
                    subject: data["subject"], text: data["body-plain"],
                    html: data["body-html"]
                });
            });
        }
    }));

};
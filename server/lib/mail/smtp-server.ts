import { getPrimaryEmail } from 'lib/primary-emails/get';
import { SendMailOptions } from 'nodemailer';
import { getProxyEmail } from 'lib/proxy-emails/get';
import { getRecipient } from 'lib/mail/get-recipient';
import { simpleParser } from 'mailparser';
import { chargeCredits } from 'lib/users/charge';
import { filterMail } from 'lib/mail/filter';
import { modifyMail } from 'lib/mail/modify';
import { SMTPServer } from 'smtp-server';
import { saveMail } from 'lib/mail/save';
import { sendMail } from 'lib/mail/send';

declare module 'mailparser' {
  interface ParsedMail {
    headerLines: { key: string; line: string }[];
  }
}

export function startSMTPServer(): SMTPServer {
  const server = new SMTPServer({
    ...process.enve.SMTP_SERVER_OPTIONS,
    authOptional: true,
    size: 25000000,
    async onData(stream, session, callback) {
      const recipients = session.envelope.rcptTo.map(r => r.address);
      const incoming = await simpleParser(stream);

      if (stream.sizeExceeded) return callback(new Error('Message too big'));
      else callback();

      for (let address of recipients) {
        const recipient = await getRecipient(address);

        // Ignore if not for Ptorx
        if (!recipient.proxyEmailId && !recipient.message) continue;

        // User does not have enough credits to accept this message
        if (recipient.user.credits < 1) continue;

        // Handle reply to a stored message
        if (recipient.message) {
          // User does not have enough credits to reply
          if (recipient.user.credits < 2) continue;

          const proxyEmail = await getProxyEmail(
            recipient.message.proxyEmailId,
            recipient.user.userId
          );

          await sendMail(proxyEmail.domainId, {
            subject: incoming.subject,
            sender: proxyEmail.fullAddress,
            from: proxyEmail.fullAddress,
            html: typeof incoming.html == 'string' ? incoming.html : undefined,
            text: incoming.text,
            to: recipient.message.replyTo || recipient.message.from
          });

          await chargeCredits(recipient.user, 2);
          continue;
        }

        const outgoing: SendMailOptions = {
          /** @todo Remove after DefinitelyTyped#32291 is solved */
          // @ts-ignore
          attachments: incoming.attachments.map(a => ({
            contentDisposition: a.contentDisposition,
            contentType: a.contentType,
            // headers also shared but needs conversion
            filename: a.filename,
            content: a.content,
            cid: a.cid
          })),
          replyTo: incoming.replyTo ? incoming.replyTo.text : undefined,
          headers: incoming.headerLines
            .map(h => ({
              key: h.key,
              value: h.line.substr(h.key.length + 2)
            }))
            // Prevent duplicate Content-Types which can cause parsing issues
            .filter(h => h.key != 'content-type'),
          subject: incoming.subject,
          sender: incoming.from.text,
          html: typeof incoming.html == 'string' ? incoming.html : undefined,
          from: incoming.from.text,
          text: incoming.text,
          date: incoming.date,
          to: incoming.to.text
        };
        const proxyEmail = await getProxyEmail(
          recipient.proxyEmailId,
          recipient.user.userId
        );
        let credits = 1;

        const savedMessage =
          proxyEmail.saveMail && recipient.user.tier != 'basic'
            ? await saveMail(incoming, proxyEmail)
            : null;

        for (let link of proxyEmail.links) {
          // Filter mail
          if (link.filterId) {
            // Stop waterfall if filter did not pass
            const pass = await filterMail(
              incoming,
              link.filterId,
              recipient.user.userId
            );
            if (!pass) break;
          }
          // Modify mail
          else if (link.modifierId) {
            await modifyMail(outgoing, link.modifierId, recipient.user.userId);
          }
          // Forward mail
          else if (link.primaryEmailId) {
            const primaryEmail = await getPrimaryEmail(
              link.primaryEmailId,
              recipient.user.userId
            );
            if (!primaryEmail.verified) continue;

            // User does not have enough credits to redirect message
            if (recipient.user.credits < credits + 1) continue;

            await sendMail(proxyEmail.domainId, {
              ...outgoing,
              envelope: {
                from: recipient.address,
                to: primaryEmail.address
              },
              replyTo: savedMessage
                ? savedMessage.ptorxReplyTo
                : outgoing.replyTo
            });
            credits++;
          }
        }

        await chargeCredits(recipient.user, credits);
      }
    }
  });
  server.on('error', console.error);
  server.listen(process.enve.SMTP_PORT);
  return server;
}

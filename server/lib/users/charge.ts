import * as Mailgun from 'mailgun-js';
import * as CONFIG from 'constants/config';

/**
 * Charges a user's account credits. If not enough credits are available it
 *  fails. If all credits are used by the action then the user's emails are
 *  deactivated but the action will not fail.
 * @async
 * @param {object} db
 * @param {number} user
 * @param {number} amount
 * @return {number} The user's remaining credits after charge.
 * @throws {string}
 */
export async function chargeUser(db, user, amount) {
  const rows = await db.query('SELECT credits FROM users WHERE userId = ?', [
    user
  ]);
  if (!rows.length) throw 'Could not find user';

  let credits = +rows[0].credits;
  if (amount > credits) throw `No credits! Need ${amount}, have ${credits}.`;
  credits -= amount;

  await db.query('UPDATE users SET credits = ? WHERE userId = ?', [
    credits,
    user
  ]);

  if (!credits) {
    // Load all routed proxy emails
    const emails = await db.query(
      `
        SELECT
          pxe.proxyEmailId AS id, pxe.mgRouteId AS mgRouteId, d.domain
        FROM
          proxy_emails AS pxe, domains AS d
        WHERE
          pxe.userId = ? AND pxe.mgRouteId IS NOT NULL
          AND d.id = pxe.domainId
      `,
      [user]
    );

    /** @type {number[]} */
    const ids = [];

    // Delete Mailgun routes
    for (let email of emails) {
      const mailgun = Mailgun({
        apiKey: CONFIG.MAILGUN_KEY,
        domain: email.domain
      });
      try {
        // @ts-ignore
        await mailgun.routes(email.mgRouteId).delete();
        ids.push(email.id);
      } catch (err) {}
    }

    await db.query(
      'UPDATE proxy_emails SET mgRouteId = NULL WHERE proxyEmailId IN (?)',
      [ids]
    );
  }

  return credits;
}
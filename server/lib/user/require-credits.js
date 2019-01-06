/**
 * Charges a user's account credits. If not enough credits are available it
 *  fails. If all credits are used by the action then the user's emails are
 *  deactivated but the action will not fail.
 * @async
 * @param {object} db
 * @param {number} user
 * @return {number} The user's credits.
 * @throws {string}
 */
module.exports = async function(db, user) {
  const [row] = await db.query('SELECT credits FROM users WHERE user_id = ?', [
    user
  ]);
  if (!row) throw 'Could not find user';

  const credits = +row.credits;
  if (!credits)
    throw 'This action is free, but requires that your account have credits';

  return credits;
};
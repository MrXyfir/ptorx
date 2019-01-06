const deleteEmail = require('lib/email/delete');
const MySQL = require('lib/mysql');

/*
  DELETE api/emails/:email
  RETURN
    { error: boolean, message?: string }
  DESCRIPTION
    Marks a proxy email as deleted, deletes its MailGun route, and deletes its
    links to any filters or modifiers
*/
module.exports = async function(req, res) {
  const db = new MySQL();

  try {
    await db.getConnection();
    await deleteEmail(db, +req.params.email, +req.session.uid);
    db.release();
    res.json({ error: false });
  } catch (err) {
    db.release();
    res.json({ error: true, message: err });
  }
};
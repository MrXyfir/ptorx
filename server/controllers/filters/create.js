const validate = require('lib/filter/validate');
const MySQL = require('lib/mysql');

/**
 * POST /api/filters
 * @param {object} req
 * @param {RequestBody} req.body
 */
/**
 * @typedef {object} RequestBody
 * @prop {number} type
 * @prop {string} name
 * @prop {string} find
 * @prop {string} description
 * @prop {boolean} [useRegex]
 * @prop {boolean} [acceptOnMatch]
 */
/**
 * @typedef {object} RequestBody
 * @prop {string} [message]
 * @prop {number} [id]
 */
module.exports = async function(req, res) {
  const db = new MySQL();
  try {
    const error = validate(req.body);
    if (error != 'ok') throw error;

    const result = await db.query('INSERT INTO filters SET ?', {
      user_id: req.session.uid,
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
      find: req.body.find,
      use_regex: !!+req.body.useRegex,
      accept_on_match: !!+req.body.acceptOnMatch
    });
    if (!result.affectedRows) throw 'Could not create filter';

    res.status(200).json({ id: result.insertId });
  } catch (err) {
    res.status(400).json({ message: err });
  }
  db.release();
};
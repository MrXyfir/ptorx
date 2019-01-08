import { creditUser } from 'lib/user/credit';
import * as CONFIG from 'constants/config';
import { MySQL } from 'lib/MySQL';
import axios from 'axios';

const COST_PER_CREDIT = 0.0005; // in USD
const COINHIVE = 'https://api.coinhive.com';

let lastStatUpdate = 0;
/**
 * @typedef {object} CoinhiveStats
 * @prop {boolean} success
 * @prop {number} globalDifficulty
 * @prop {number} globalHashrate
 * @prop {number} blockReward
 * @prop {number} payoutPercentage
 * @prop {number} payoutPer1MHashes
 * @prop {number} xmrToUsd
 * @prop {number} updated
 * @prop {string} [error]
 */
/** @type {CoinhiveStats} */
let stats = null;

/**
 * Get payout stats for Coinhive. Load from cache, or update every 10+ minutes.
 * @async
 * @return {CoinhiveStats}
 */
async function getCoinhiveStats() {
  if (stats && Date.now() - 600 * 1000 < lastStatUpdate) return stats;

  const res = await axios.get(`${COINHIVE}/stats/payout`, {
    params: { secret: CONFIG.COINHIVE_SECRET }
  });
  stats = res.data;
  lastStatUpdate = Date.now();

  return stats;
}

export async function getCoinhiveCredits(req, res) {
  const db = new MySQL();

  try {
    let response = await axios.get(`${COINHIVE}/user/balance`, {
      params: { secret: CONFIG.COINHIVE_SECRET, name: req.session.uid }
    });
    if (!response.data.success) throw response.data.error;

    const stats = await getCoinhiveStats();

    // Payout per hash in USD
    const payoutPerHash = (stats.payoutPer1MHashes / 1000000) * stats.xmrToUsd;
    // User's uncredited balance in USD
    const balance = response.data.balance * payoutPerHash;

    // The total amount of credits the user has earned
    // Includes any credits the user *will* earn below on success
    const earned = Math.floor(
      (response.data.total * payoutPerHash) / COST_PER_CREDIT
    );

    // The user's current amount of credits
    /** @type {number} */
    let credits;

    // Credit user's account
    if (balance >= COST_PER_CREDIT) {
      // Determine how many credits to reward the user with
      // Take hashes in increments equal to COST_PER_CREDIT, leave remainder
      const reward = Math.floor(balance / COST_PER_CREDIT);

      response = await axios.post(
        `${COINHIVE}/user/withdraw`,
        {
          name: req.session.uid,
          // Convert credits -> USD -> hashes
          amount: Math.ceil((reward * COST_PER_CREDIT) / payoutPerHash)
        },
        { params: { secret: CONFIG.COINHIVE_SECRET } }
      );
      if (!response.data.success) throw response.data.error;

      credits = await creditUser(db, +req.session.uid, reward);
    }

    res.status(200).json({ earned, credits });
  } catch (err) {
    res.status(400).json({ error: err });
  }

  db.release();
}
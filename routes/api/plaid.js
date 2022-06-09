const express = require("express");
const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");
const router = express.Router();
const passport = require("passport");
const moment = require("moment");

// Load Account and User models
const Account = require("../../models/Account");
const User = require("../../models/User");

const PLAID_CLIENT_ID = "62969bc579931a0014d8a99e";
const PLAID_SECRET = "626bb64c3457d2b787f8694e3c10bb";

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

var PUBLIC_TOKEN = null;
var ACCESS_TOKEN = null;
var ITEM_ID = null;

router.post('/create_link_token', passport.authenticate('jwt', { session: false}), async (req, res) => {
  try{
    const response = await client.linkTokenCreate({
      user: {
        client_user_id: req.user._id,
      },
      client_name: 'Plaid Test App',
      products: ['auth', 'transactions'],
      country_codes: ['US'],
      language: 'en',
      webhook: 'https://sample-web-hook.com',
      account_filters: {
        depository: {
          account_subtypes: ['checking', 'savings'],
        },
      },
    })
    return res.send({link_token: response.data.link_token})
    } catch (err) {
    return res.send({err: err.message})
  }
});

router.post('/get_link_token', async(req, res) => {
  const response = await client.getLinkToken(linkToken).catch((err) => {
    if(!linkToken){
        return "no link token"
    }
  });
})

router.post('/exchange-public-token', async(req, res) => {
  const { public_token } = req.body
  const response = await client
    .itemPublicTokenExchange({ public_token })
    .catch((err) => {
      if(!public_token){
        return "no public token"
      }
    });
  return res.send({ access_token: response.data.access_token, item_id: response.data.item_id })
})

// @route GET api/plaid/accounts
// @desc Get all accounts linked with plaid for a specific user
// @access Private
router.get(
  "/accounts",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Account.find({ userId: req.user.id })
      .then(accounts => res.json(accounts))
      .catch(err => console.log(err));
  }
);

// @route POST api/plaid/accounts/add
// @desc Trades public token for access token and stores credentials in database
// @access Private
router.post(
  "/accounts/add",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { accessToken, itemId, metadata } = req.body;
    // Check if account already exists for specific user
    Account.findOne({
      userId: req.user.id,
      institutionId: metadata.institution.institution_id
    })
      .then(account => {
        if (account) {
          console.log("Account already exists");
        } else {
          const newAccount = new Account({
            userId: req.user.id,
            accessToken,
            itemId,
            institutionId: metadata?.institution?.institution_id,
            institutionName: metadata?.institution?.name,
            accountId: metadata?.account?.id,
            accountName: metadata?.account?.name,
            accountType: metadata?.account?.type,
            accountSubtype: metadata?.account?.subtype,
          });

          newAccount.save().then(account => res.json(account));
        }
      })
      .catch(err => console.log(err)); // Mongo Error
  }
);

// @route DELETE api/plaid/accounts/:id
// @desc Delete account with given id
// @access Private
router.delete(
  "/accounts/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Account.findById(req.params.id).then(account => {
      // Delete account
      account.remove().then(() => res.json({ success: true }));
    });
  }
);

module.exports = router;

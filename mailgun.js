const request = require('4k/request')
const api = require('4k/api')
const c = require('4k')

const { DOMAIN, MAILGUN_APIKEY } = process.env
const list = `blog@${DOMAIN}`

const auth = Buffer(`api:${MAILGUN_APIKEY}`).toString('base64')
const mg = api(c.fast([
  request.use('https://api.mailgun.net'),
  request.use({ headers: { Authorization: `Basic ${auth}` } }),
]))

module.exports = {
  addEmail: c.fast([
    (address, subscribed) => ({
      body: { vars: `{"joinedAt":${Date.now()}}`, subscribed, address },
    }),
    mg.post.v3.lists[list].members,
  ]),
}

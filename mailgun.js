const { MAILGUN_DOMAIN: domain, MAILGUN_APIKEY: apiKey } = process.env
const mailgun = require('mailgun-js')({ apiKey, domain })
const members = mailgun.lists(`blog@${domain}`).members()
const create = params => new Promise((s, f) =>
  members.create(params, (e, r) => e ? f(e) : s(r)))

module.exports = {
  addEmail: (address, subscribed) => create({ address, subscribed }),
}

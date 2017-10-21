const { STATUS_CODES } = require('http')
const mailgun = require('./mailgun')
// Restrictions:
// you may not use 'req' as param name

module.exports = {
  GET: {
    '/email/': {
      description: 'Add an email to the list',
      params: { email: String, sub: Boolean },
      handler: ({ email, sub }) => mailgun.addEmail(email, sub),
    },
  },
}

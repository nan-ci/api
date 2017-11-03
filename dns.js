const { request } = require('https')
const { error: { _403 } } = require('./errors')

const isValidDns = (login, name) => name.endsWith(`${login}.nan.ci`)
const appendLogin = (login, name) => isValidDns(login, name)
  ? name
  : `${name}.${login}.nan.ci`

const cfPath = [
  '/client/v4',
  'zones', process.env.CLOUDFLARE_ZONEID,
  'dns_records',
].join('/')

const cf = (method, record, data) => request({
  method,
  host: 'api.cloudflare.com',
  path: cfPath + (record && `/${record}`),
  headers: {
    'X-Auth-Email': process.env.CLOUDFLARE_EMAIL,
    'X-Auth-Key': process.env.CLOUDFLARE_APIKEY,
    'Content-Type': 'application/json',
  },
}, data).then(JSON.parse)

const create = ({ token, name, ...params }) =>
  cf('POST', '', { name: appendLogin(token, name), ...params })

const list = ({ token, name, ...params }) =>
  cf('GET', '', { name: appendLogin(token, name), ...params })

const details = (token, record) => cf('GET', record)
  .then(recordDetails =>
    isValidDns(token, recordDetails.name)
      ? recordDetails
      : Promise.reject(_403))

const update = ({ token, record, name, ...params }) => details(token, record)
  .then(() => cf('PUT', record, { name: appendLogin(token, name), ...params }))

module.exports = {
  delete: ({ token, record }) => details(token, record)
    .then(() => cf('DELETE', record)),
  details,
  update,
  create,
  list,
}

const gh = (method, token, path, data) => request({
  headers: { 'User-Agent': 'NaN-App', Authorization: `Token ${token}` },
  host: 'api.github.com',
  method,
  path,
}).then(JSON.parse)

gh.get = (t, p, d) => gh('GET', t, p, d)

module.exports = {
  user: token => gh.get(token, '/user'),
}

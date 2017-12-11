const WebSocket = require('ws')

let wss

const init = server => {
  wss = new WebSocket.Server({ server })

  wss.on('connection', (ws, req) => {
    ws.send(lastEmitedData)
  })
}

let lastEmitedData = '{}'

const emit = data => {
  lastEmitedData = JSON.stringify(data)

  if (!wss) throw Error('ws server not initialized')

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(lastEmitedData)
    }
  })
}


module.exports = { init, emit }

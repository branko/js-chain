const express = require('express')
const app = express()
const Cache = require('./scripts/cache')
const Blockchain = require('./scripts/blockchain')
const bodyParser = require('body-parser')

function validateIncomingBlockchain(incoming, current) {
  for (block of incoming.chain) {
    let {timestamp, previousHash, transactions, nonce} = block;

    newBlock = {
      timestamp,
      previousHash,
      transactions,
      nonce,
    }

    let newBlockHash = Blockchain.SHA(newBlock)

    if (newBlockHash !== block.hash) {
      return false
    };
  }
  return true
}

app.use(bodyParser.json()) // Gives us access to body-parser


app.get('/', (req, res) => {
  res.send('fuck you');
})

app.get('/blockchain', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(Cache.readJSON());
})

app.post('/blockchain', (req, res) => {
  let incomingBlockchain = req.body;

  if (true) {
    let current = JSON.parse(Cache.readJSON())

    if (current.chain.length < incomingBlockchain.chain.length) {
      Cache.write(JSON.stringify(incomingBlockchain, null, 4));
    }
  } else {
    res.send('Invalid blockchain.')
  }
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))

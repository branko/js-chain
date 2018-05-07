const express = require('express')
const app = express()
const Cache = require('./cache')
const Blockchain = require('./blockchain')

validateIncomingBlockchain(incoming, current) {
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
  })
  return true
}

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(Cache.readJSON());
})

app.post('/', (req, res) => {
  let incomingBlockchain = JSON.parse(req);

  if (validateIncomingBlockchain(incomingBlockchain)) {
    let current = JSON.parse(Cache.readJSON())
    if (current.chain.length < incomingBlockchain.chain.length) {
      Cache.write(incomingBlockchain);
    }
  } else {
    res.send('Invalid blockchain.')
  }
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))



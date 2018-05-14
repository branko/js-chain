const express = require('express');
const app = express();
const readline = require('readline');
const bodyParser = require('body-parser');
const fs = require('fs');
const exec = require('child_process').exec;
const SHA1 = require('crypto-js/sha1');
const miningEventEmitter = require('./scripts/miningEvents')

const Cache = require('./scripts/cache');
const Blockchain = require('./scripts/blockchain');
const RSA = require('./rsa');
const kademlia = require('./kademlia');
const CLI = require('./scripts/cli')

// Clears the screen
process.stdout.write('\033c');

const REWARD_AMOUNT = 10;

class Client {
  constructor(seed) {
    this.seed = seed;
    this.blockchain = new Blockchain();

    if (fs.existsSync('./public/blockchain.json')) {
      let cachedBlockchain = JSON.parse(fs.readFileSync('./public/blockchain.json'))
      this.blockchain.chain = cachedBlockchain.chain
    } else {
      if (!fs.existsSync('./public')) { fs.mkdirSync('public') };
      exec('touch ./public/blockchain.json');
    }

    miningEventEmitter.on('blockWasMined', () => {
      this.blockchain.broadcastBlockchain(this.getPeers())
    })
  }

  validateIncomingBlockchain(incoming, current) {
    for (let block of incoming.chain) {
      let {timestamp, previousHash, transactions, nonce} = block;

      let newBlock = {
        timestamp,
        previousHash,
        transactions,
        nonce,
      }

      newBlock.hash = Blockchain.SHA(newBlock)

      // Checks validity of reward blocks, which has a null fromAddress
      if (transactions.some(t => t.fromAddress === null)) {
        let nullTransactions = transactions.filter(transaction => { transaction.fromAddress === null })

        if (nullTransactions.length > 1) {
          console.log("One of your null transactions is invalid")
          return false
        }
      }

      // Checks validity of proof of work by comparing hashes to rehash of new block
      console.log(newBlock.hash)
      console.log(block.hash)

      if (newBlock.hash !== block.hash) {
        console.log("One of your blockchain hashes is invalid")

        return false;
      };
    }
    console.log("Your blockchain is Valid!")
    return true
  }

  readlineInterface() {
    return readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
  }

  promptKeyGeneration() {
    const rl = this.readlineInterface();

    rl.question('\n\nWould you like to generate a private + public key? [y/n]\n\n', (answer) => {
      if (answer === 'y') {
        CLI.puts("Generating keys...")

        RSA.generateKeys().then((val) => {
          let identity = SHA1(fs.readFileSync('./keys/pubkey.pub')).toString();
          this.kademliaNode = kademlia(identity, this.seed ? this.seed : undefined);

          this.promptMining();
        });

        rl.close();
      } else {
        CLI.puts("You must generate keys before proceeding.");
        rl.close();
        return this.promptKeyGeneration();
      }
      return;
    });
  }

  promptMining() {
    const rl = this.readlineInterface();

    rl.question('\n\nWould you like to begin mining? [y/n]\n\n', (answer) => {
      if (answer === 'y') {
        CLI.puts('You chose to start mining...');
        this.blockchain.beginMining();
        rl.close()
      } else {
        CLI.puts("You chose not to mine\n\n");
        rl.close()
      }
    });
  }

  keysExist() {
    return fs.existsSync('./keys/privkey.pem') && fs.existsSync('./keys/pubkey.pub');
  }

  getPeers() {
    let peers = [];
    let peerAddresses = [];

    this.kademliaNode.router.forEach((bucket) => {
      if (bucket.head) {
        peers.push(bucket)
      }
    })

    peers.forEach(bucket => {
      if (bucket.head) {
        bucket.forEach(peer => {
          peerAddresses.push(peer.hostname + ':' + peer.port)
        })
      }
    })

    return peerAddresses;
  }

  start() {
    app.use(bodyParser.urlencoded())
    app.use(bodyParser.json()) // Gives us access to body-parser

    // GET Requests

    // Root path
    app.get('/', (req, res) => {
      res.send(':)');
    })

    // Get current blockchain
    app.get('/blockchain', (req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.send(this.blockchain.chain);
    })

    // Get form to create transaction
    app.get('/transaction', (req, res) => {
      res.sendFile('index.html', { root: __dirname })
    })

    // POST Requests

      // New blockchain
    app.post('/blockchain', (req, res) => {
      console.log("INCOMING BLOCKCHAIN!");

      let incomingChain = req.body.chain;
      let incomingBlockchain = new Blockchain;

      incomingBlockchain.chain = incomingChain

      let currentBlockchain = JSON.parse(Cache.readJSON());

      if (this.validateIncomingBlockchain(incomingBlockchain, currentBlockchain)) {
        console.log("YAY! validated!");

        if (currentBlockchain.chain.length < incomingBlockchain.chain.length) {
          Cache.write(JSON.stringify(incomingBlockchain, null, 4));
        }
        res.send('Thank you for your blockchain')
      } else {
        res.send('Invalid blockchain.')
      }
    })

      // New transaction
    app.post('/transaction', (req, res) => {
      const fromAddress = req.body.from;
      const toAddress = req.body.to;
      const amount = Number(req.body.amount);
      const validTransaction = this.blockchain.createTransaction(fromAddress, toAddress, amount);

      if (validTransaction) {
        res.send(`Pending transaction: ${fromAddress} to ${toAddress} for the amount of $${amount}`)
      } else {
        res.send(`Transaction declined: Insufficient funds.`)
      }
    })

    app.listen(process.env.PORT || 3000, () => {
      CLI.header("Welcome to js-chain")
      CLI.puts('Client is now listening on port 3000!')

      if (!this.keysExist()) {
        this.promptKeyGeneration();
      } else {
        // this.identity = SHA1(fs.readFileSync('./keys/pubkey.pub')).toString();
        this.identity = '9844f81e1408f6ecb932137d33bed70000000001'
        this.kademliaNode = kademlia(this.identity, this.seed);
        this.promptMining();
      }

      // This code outputs the number of closest peers to the seed node

      // setInterval(() => {
      //   let peers = this.getPeers();
      //   console.log(`You have ${peers.length} peers`)
      //   console.log("--> Current list of peers: " + peers.join(', '));
      // }, 3000);
    })
  }
}

let seed = ['9844f81e1408f6ecb932137d33bed7cfdcf518a3', {
  hostname: '167.99.180.30',
  port: 3000
}];


const client = new Client(seed)

client.start()


const http = require('http');
const express = require('express');
const app = express();
const readline = require('readline');
const bodyParser = require('body-parser');
const fs = require('fs');
const exec = require('child_process').exec;
const SHA1 = require('crypto-js/sha1');
const eventEmitter = require('./scripts/miningEvents');
const ip = require("ip");
const request = require('request');
const _ = require('underscore');
const localtunnel = require('localtunnel');

const Cache = require('./scripts/cache');
const Blockchain = require('./scripts/blockchain');
const RSA = require('./rsa');
const CLI = require('./scripts/cli');
const BasicClient = require('./basic_client')

// Clears the screen
process.stdout.write('\033c');

function checkArguments(arg) {
  return process.argv.includes(arg)
}

const REWARD_AMOUNT = 10;

class Client extends BasicClient {
  constructor(seed) {
    super(seed);

    eventEmitter.on('blockWasMined', () => {
      this.blockchain.broadcastBlockchain(this.getPeers());
      this.broadcastBlockchainToNetwork();
    })
  }

  broadcastBlockchainToNetwork() {
    this.peers.forEach(peer => {
      console.log('Blockchain sent to ' + peer)

      let url;
      if (!peer.match(/[a-z]/gi)) {
        url = "http://" + peer + ":3000";
      } else {
        url = peer;
      }

      console.log("URL: " + url)

      const options = {
        method: "POST",
        url: url + '/blockchain',
        port: 3000,
        headers: { 'Content-Type': 'application/json' },
        json: this.blockchain.chain,
      }

      request(options, (err, res, body) => {
        if (err) {
          console.log(err)
          this.peers = _(this.peers).without(peer);
          console.log(`Kicked ${peer} off the network because it is non-responsive`)
        }

        console.log(body)
      })
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
      if (newBlock.hash !== block.hash) {
        console.log("One of your blockchain hashes is invalid")

        return false;
      };
    }
    console.log("Your blockchain is Valid!")
    return true
  }

  promptKeyGeneration() {
    const rl = this.readlineInterface();

    rl.question('\n\nWould you like to generate a private + public key? [y/n]\n\n', (answer) => {
      if (answer === 'y') {
        CLI.puts("Generating keys...")

        RSA.generateKeys().then(() => {
          let identity = SHA1(fs.readFileSync('./keys/pubkey.pub')).toString();
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

  start(tunnelUrl) {
    this.joinNetwork(tunnelUrl);
    this.pingAll();

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
      console.log("Incoming blockchain...!");

      let incomingChain = req.body;
      let incomingBlockchain = new Blockchain;

      incomingBlockchain.chain = incomingChain

      let currentBlockchain = JSON.parse(Cache.readJSON());

      if (this.validateIncomingBlockchain(incomingBlockchain, currentBlockchain)) {

        if (currentBlockchain.chain.length < incomingBlockchain.chain.length) {
          Cache.write(JSON.stringify(incomingBlockchain, null, 4));
          this.blockchain.stopMining();
          this.blockchain = incomingBlockchain;
          console.log(`Recieved blockchain accepted, length: ${incomingBlockchain.chain.length}`)
        } else {
          console.log(`Recieved blockchain is shorter than your local blockchain (${currentBlockchain.chain.length} vs ${incomingBlockchain.chain.length})`)
        }

        res.send('Blockchain recieved')
      } else {
        res.send('Invalid blockchain.')
      }
    })

      // New transaction
    app.post('/transaction', (req, res) => {
      const transaction = req.body;
      console.log('Incoming transaction!')

      if (this.blockchain.verifyTransactionFunds(transaction.fromAddress, transaction.amount) &&
          Transaction.prototype.verify.call(transaction)) {
        console.log("Verified!")
        res.send(`Pending transaction: ${transaction.fromAddress} to ${transaction.toAddress} for the amount of $${transaction.amount}`)
      } else {
        console.log("Denied!")
        res.send(`Transaction declined: Insufficient funds.`)
      }
    })

    // Peer communication routes

    // GET status -> Used to ping peers for activity
    app.get('/status', (req, res) => {
      res.send("I'm currently active");
    })

    // GET peers -> Used to pull a list of peers from a node
    app.get('/peers', (req, res) => {
      res.json(this.peers);
    })

    app.get('/all_transactions', (req, res) => {
      // Iterate through blockchain and print
      // every transaction in every block

      // Possible output:
        // Block # 1
          // # of tx: 3
          // tx, tx, tx
        // Block # 2
          // # of tx: 4
          // tx, tx, tx, tx
    })

    // POST peers -> Used to push a list of peers to a node
    app.post('/peers', (req, res) => {
      this.peers = _.union(this.peers, req.body);
      res.send(`Thanks for the peers.`);
    })

    // POST connection => Used to establish connection with peer
    app.post('/connection', (req, res) => {
      console.log("Incoming!");

      this.peers.push(req.body.ip);
      console.log("New joiner: " + req.body.ip)
      console.log("Current peers: " + this.peers);
      res.send(`IP ${req.body.ip} has joined the network`);
      this.pushPeersToNetwork();
    })

    app.listen(process.env.PORT || 3000, () => {
      CLI.header("Welcome to js-chain")
      CLI.puts('Client is now listening on port 3000!')

      if (!this.keysExist()) {
        this.promptKeyGeneration();
      } else {
        this.identity = SHA1(fs.readFileSync('./keys/pubkey.pub')).toString();
        CLI.puts(`Your public key: ${this.identity}`)

        if (checkArguments('--t')) {
          let answer = this.promptNewTransaction()

          answer.then((answers) => {
            console.log("\nNew transaction:")
            console.log(`From: ${RSA.getPublicKey()}, To: ${answers[1]}, Amount: ${answers[2]}`)
            this.promptMining();
          }).catch((answer) => {
            console.log('Your answer was ' + answer)
          })

        } else {
          this.promptMining();
        }
      }

      // This code outputs the number of closest peers to the seed node

      if (checkArguments('--log')) {
        setInterval(() => {
          CLI.puts(`You have ${this.peers.length} peers`)
          CLI.puts("--> Current list of peers: " + this.peers.join(', '));
        }, 3000);
      }
    })
  }
}

let client;

if (checkArguments('--seed')) {

// Steven's droplet: 167.99.180.30
// Branko's droplet: 138.197.158.101
// Branko's droplet 2: 165.227.34.12
  client = new Client();

} else {
  let seed = "138.197.158.101";

  client = new Client(seed);
}




if (checkArguments('--tunnel')) {

  const tunnel = localtunnel(3000, function(err, tunnel) {
      if (err) {
        console.log(err)
      }

      // the assigned public url for your tunnel
      // i.e. https://abcdefgjhij.localtunnel.me
      console.log("This is the tunnel.url: " + tunnel.url)

      client.start(tunnel.url);
  });

  tunnel.on('close', function() {
      // tunnels are closed
  });
} else {
  client.start()
}

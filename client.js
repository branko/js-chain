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
const _ = require('underscore')

const Cache = require('./scripts/cache');
const Blockchain = require('./scripts/blockchain');
const RSA = require('./rsa');
// const kademlia = require('./kademlia');
const CLI = require('./scripts/cli');

// Clears the screen
process.stdout.write('\033c');

function checkArguments(arg) {
  return process.argv.includes(arg)
}

const REWARD_AMOUNT = 10;

class Client {
  constructor(seed) {
    this.peers = [];

    if (seed) {
      this.seed = seed;
      this.peers.push(seed)
    }

    this.blockchain = new Blockchain();

    if (fs.existsSync('./public/blockchain.json')) {
      let cachedBlockchain = JSON.parse(fs.readFileSync('./public/blockchain.json'))
      this.blockchain.chain = cachedBlockchain.chain
    } else {
      if (!fs.existsSync('./public')) { fs.mkdirSync('public') };
      exec('touch ./public/blockchain.json');
    }

    eventEmitter.on('blockWasMined', () => {
      this.blockchain.broadcastBlockchain(this.getPeers());
      this.broadcastBlockchainToNetwork();
    })
  }

  broadcastBlockchainToNetwork() {
    // https://rude-fireant-81.localtunnel.me

    this.peers.forEach(peer => {
      console.log('Blockchain sent to ' + peer)

      // https://rude-fireant-81.localtunnel.me

      let url;
      if (!peer.match(/[a-z]/gi)) {
        url = "http://" + peer;
      } else {
        url = peer;
      }

      console.log("URL: " + url)

      const options = {
        method: "POST",
        url: url,
        port: 3000,
        headers: { 'Content-Type': 'application/json' },
        json: this.blockchain.chain,
      }

      console.log(options)

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
          // this.kademliaNode = kademlia(identity, this.seed ? this.seed : undefined);

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

  promptNewTransaction() {
    const rl = this.readlineInterface();

    return new Promise((resolve, reject) => {
      rl.question('\n\nWould you like to make a new transaction? [y/n]\n\n', (answer) => {
        if (answer === 'y') {
          rl.question('\n\nWhat is the "to" address?\n\n', (fromAnswer) => {
            // Validate fromAnswer here
            rl.question('\n\nWhat is the "from" address?\n\n', (toAnswer) => {
              // Validate toAnswer here
              rl.question('\n\nWhat is the amount?\n\n', (amountAnswer) => {
                // Validate amountAnswer here
                rl.close()
                resolve([fromAnswer, toAnswer, amountAnswer])
              })
            })
          })
        } else {
          rl.close()
          reject(answer)
        }
      })
    })
  }

  keysExist() {
    return fs.existsSync('./keys/privkey.pem') && fs.existsSync('./keys/pubkey.pub');
  }

  getPeers() {
    let peers = [];
    let peerAddresses = [];

    // this.kademliaNode.router.forEach((bucket) => {
    //   if (bucket.head) {
    //     peers.push(bucket)
    //   }
    // })

    peers.forEach(bucket => {
      if (bucket.head) {
        bucket.forEach(peer => {
          peerAddresses.push(peer.hostname + ':' + peer.port)
        })
      }
    })

    return peerAddresses;
  }

  joinNetwork(tunnelUrl) {
    this.peers.forEach(peer => {
      console.log(tunnelUrl ? tunnelUrl : ip.address());

      const options = {
        method: "POST",
        url: "http://" + peer + ':3000' + "/connection",
        port: 3000,
        form: { ip: tunnelUrl ? tunnelUrl : ip.address() },
      }

      request(options, (err, res, body) => {
        if (err) {
          console.log(err)
        }

        console.log(body)
      })
    })
  }

  ping(peer) {
    const options = {
      hostname: peer,
      port: 3000,
      path: '/status',
    }

    http.get(options, (resp) => {
      let data = '';

      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        console.log(data);
      });

    }).on("error", (err) => {
      console.log("Error: " + err.message);
    })
  }

  pingAll() {
    console.log("Trying to ping all")
    // Iterate over all peers and ping them

    this.peers.forEach(peer => {
      this.ping(peer);
    })
  }

  pullPeers() {
    this.peers.forEach(peer => {
      const options = {
        method: "GET",
        url: "http://" + peer + ':3000' + "/peers",
        port: 3000,
      }

      request(options, (err, res, body) => {
        if (err) {
          console.log(err)
        }
        console.log(body)
      })
    })
  }

  pushPeersToNetwork() {
    this.peers.forEach(peer => {
      const options = {
        method: "POST",
        url: "http://" + peer + ':3000' + "/peers",
        port: 3000,
        json: this.peers,
        headers: {'Content-Type': 'application/json'}
      }

      request(options, (err, res, body) => {
        if (err) {
          console.log(err)
        }
        console.log(body)
      })
    })
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
      console.log("INCOMING BLOCKCHAIN!");

      let incomingChain = req.body;
      let incomingBlockchain = new Blockchain;

      incomingBlockchain.chain = incomingChain

      let currentBlockchain = JSON.parse(Cache.readJSON());

      if (this.validateIncomingBlockchain(incomingBlockchain, currentBlockchain)) {

        if (currentBlockchain.chain.length < incomingBlockchain.chain.length) {
          Cache.write(JSON.stringify(incomingBlockchain, null, 4));
          this.blockchain.stopMining();
          this.blockchain = incomingBlockchain;
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

    // Peer communication routes

    // GET status -> Used to ping peers for activity
    app.get('/status', (req, res) => {
      res.send("I'm currently active");
    })

    // GET peers -> Used to pull a list of peers from a node
    app.get('/peers', (req, res) => {
      res.json(this.peers);
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

        // this.kademliaNode = kademlia(this.identity, this.seed);

        if (checkArguments('--t')) {
          let answer = this.promptNewTransaction()

          answer.then((answers) => {
            console.log("\nNew transaction:")
            console.log(`From: ${answers[0]}, To: ${answers[1]}, Amount: ${answers[2]}`)
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
  // let seed = ['9844f81e1408f6ecb932137d33bed7cfdcf518a3', {
  //   hostname: '167.99.180.30',
  //   port: 3000
  // }];

// Steven's droplet: 167.99.180.30
// Branko's droplet: 138.197.158.101
  let seed = "138.197.158.101";

  client = new Client(seed);
} else {
  client = new Client();
}



var localtunnel = require('localtunnel');

if (checkArguments('--tunnel')) {

  var tunnel = localtunnel(3000, function(err, tunnel) {
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












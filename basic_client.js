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

class BasicClient {
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
  }

  readlineInterface() {
    return readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
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

  joinNetwork(tunnelUrl) {
    this.peers.forEach(peer => {

      let url;
      if (!peer.match(/[a-z]/gi)) {
        url = "http://" + peer + ":3000";
      } else {
        url = peer;
      }

      const options = {
        method: "POST",
        url: url + "/connection",
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

  keysExist() {
    return fs.existsSync('./keys/privkey.pem') && fs.existsSync('./keys/pubkey.pub');
  }

  getPeers() {
    let peers = [];
    let peerAddresses = [];

    peers.forEach(bucket => {
      if (bucket.head) {
        bucket.forEach(peer => {
          peerAddresses.push(peer.hostname + ':' + peer.port)
        })
      }
    })

    return peerAddresses;
  }

}

module.exports = BasicClient
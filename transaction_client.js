const BasicClient = require('./basic_client');
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
const Transaction = require('./scripts/transaction');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

process.stdout.write('\033c');

function checkArguments(arg) {
  return process.argv.includes(arg)
}

class TransactionClient extends BasicClient {
  constructor(seed) {
    super(seed);
    RSA.generateKeys();
  }

  start(tunnelUrl) {
    this.joinNetwork();
    this.promptNewTransaction().then(transactionInfo => {
      let transaction = new Transaction(...transactionInfo);
      for (let peerURL of this.peers) {
        const request = new XMLHttpRequest();
        request.open('POST', "http://" + peerURL + ':3000/transaction');
        request.setRequestHeader('Content-Type', 'application/json')

        request.addEventListener('load', () => {
          console.log(request.status);
          console.log(request.response);
        })
        request.send(JSON.stringify(transaction));
      }
    })
  }
}

let client;

if (checkArguments('--seed')) {

// Steven's droplet: 167.99.180.30
// Branko's droplet: 138.197.158.101
  client = new TransactionClient();

} else {
  let seed = "138.197.158.101";

  client = new TransactionClient(seed);
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

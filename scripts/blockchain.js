const Block = require('./block');
const Cache = require('./cache');
const Transaction = require('./transaction');
const SHA256 = require('crypto-js/sha256');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const fs = require('fs');

const eventEmitter = require('./miningEvents')

const REWARD_AMOUNT = 10;

class Blockchain {
  constructor() {
    this.chain = [];
    this.pendingTransactions = [];
    this.difficulty = 4;
    this.createGenesisBlock();

    
  }

  static SHA(str) {
    return SHA256(JSON.stringify(str)).toString();
  }

  SHA(str) {
    return SHA256(JSON.stringify(str)).toString();
  }

  createGenesisBlock() {
    const genesisBlock = new Block('0', null, [
      new Transaction(null, 'Branko', 100),
      new Transaction('Branko', "Steven", 50)
    ]);

    genesisBlock.nonce = 0;

    genesisBlock.hash = this.SHA(genesisBlock);

    this.chain.push(genesisBlock);

    if (!fs.existsSync('./public/blockchain.json')) {
      Cache.write(this)
    }
  }

  broadcastBlockchain(peers) {
    for (let peerURL of peers) {
      const request = new XMLHttpRequest();

      request.open('POST', "http://" + peerURL + '/blockchain');
      request.setRequestHeader('Content-Type', 'application/json')

      request.addEventListener('load', () => {
        console.log(request.status);
        console.log(request.response);
      })

      request.send(JSON.stringify(this));
    }
  }

  createRewardTransaction() {
    return new Transaction(null, 'Branko', REWARD_AMOUNT);
  }

  stopMining() {
    this.currentlyMining = false;
  }

  mineBlock() {
    console.log(`\n=====================\n==== Mining block #${this.chain.length}\n`);
    this.currentlyMining = true;

    let rewardTransaction = this.createRewardTransaction();
    let tempTransactions = this.pendingTransactions.slice();
    tempTransactions.push(rewardTransaction);

    let newBlock = new Block(Date.now(), this.chain[this.chain.length - 1].hash, tempTransactions);
    newBlock.nonce = 0;

    let miningInterval = setInterval(() => {
      if (this.SHA(newBlock).slice(0, this.difficulty) !== Array(this.difficulty + 1).join('0')) {
        newBlock.nonce++;

        if (!this.currentlyMining) {
          console.log('\n\n\n\n\n\n')
          console.log("Stopped mining...")

          this.pendingTransactions = [];
          clearInterval(miningInterval);
        }

        if (newBlock.nonce % 100 === 0) { process.stdout.write('.') }
      } else {
        // Compare local blockchain in blockchain.json with in memory blockchain
        let localBlockchain = JSON.parse(Cache.readJSON())

        if (localBlockchain.chain.length > this.chain.length) {
          this.chain = localBlockchain.chain;
          this.pendingTransactions = [];
          return;
        }

        newBlock.hash = this.SHA(newBlock);

        process.stdout.write('\n\n~~~ Block Mined! ~~~\n\n')
        console.log(newBlock.toString());

        this.chain.push(newBlock);
        this.pendingTransactions = [];

        // Write to local .json file

        Cache.write(this.toString());

        clearInterval(miningInterval);
        this.currentlyMining = false;
        eventEmitter.emit('blockWasMined');
      }
    }, 0);
  }

  isValid() {
    for (let i = 1; i < this.chain.length; i++) {
      if (this.chain[i].previousHash !== this.chain[i - 1].hash) {
        return false
      }
    }

    return true
  }

  createTransaction(fromAddress, toAddress, amount) {
    if (this.getBalanceForAddress(fromAddress) >= +amount) {
      this.pendingTransactions.push(new Transaction(fromAddress, toAddress, amount));
      return true;
    } else {
      return false;
    }
  }

  getTransactionsForAddress(address) {
    let transactionsForAddress = [];
    this.chain.forEach(block => {
      block.transactions.forEach(transaction => {
        if (transaction.fromAddress === address || transaction.toAddress === address) {
          transactionsForAddress.push(transaction);
        }
      })
    })
    return transactionsForAddress;
  }

  getBalanceForAddress(address) {
    let balance = 0;

    this.chain.forEach(block => {
      block.transactions.forEach(transaction => {

        if (transaction.toAddress === address) {
          balance += +transaction.amount;
        } else if (transaction.fromAddress === address) {
          balance -= +transaction.amount;
        }
      })
    })

    return balance;
  }

  validTransactionsForAddress(address) {
    let balance = 0;
    for (let transaction of this.getTransactionsForAddress(address)) {
      if (transaction.toAddress === address) {
        balance += transaction.amount;
      } else if (transaction.fromAddress === address) {
        balance -= transaction.amount;
        if (balance < 0) {
          return false;
        }
      }
    }
    return true;
  }

  beginMining() {
    const mine = setInterval(() => {

      // Dummy transaction
      if (Math.random() > 0.5) {
        this.createTransaction('Steven', 'Branko', Math.ceil(5 * Math.random()));
      } else {
        this.createTransaction('Branko', 'Steven', Math.ceil(5 * Math.random()));
      }

      if (!this.currentlyMining) {
        this.mineBlock();
      }

    }, 1000);
  }

  toString() {
    return JSON.stringify(this, null, 2);
  }
}

module.exports = Blockchain;

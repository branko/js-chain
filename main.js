// Todo:

// get Transactions for address
// calculate total for address
// implement public/private keys
//
//

const SHA256 = require('crypto-js/sha256');

class Transaction {
  constructor(fromAddress, toAddress, amount) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
  }
}

class Block {
  constructor(timestamp, previousHash, transactions) {
    this.timestamp = timestamp;
    this.previousHash = previousHash;
    this.transactions = transactions;
  }

  toString() {
    console.log(JSON.stringify(this, null, 2));
  }
}

class Blockchain {
  constructor() {
    this.chain = [];
    this.pendingTransactions = [];
    this.difficulty = 2;

    const createGenesisBlock = () => {               ///////// Turn into IIFE
      const gb = new Block('0', null, []);
      gb.hash = this.SHA('hello world');
      gb.nonce = 0;

      this.chain.push(gb);
    };

    createGenesisBlock();
  }

  SHA(str) {
    return SHA256(JSON.stringify(str)).toString();
  }

  mineBlock() {
    let newBlock = new Block(Date.now(), this.chain[this.chain.length - 1].hash, this.pendingTransactions);
    newBlock.nonce = 0;

    while (this.SHA(newBlock).slice(0, this.difficulty) !== Array(this.difficulty + 1).join('0')) {
      console.log(this.SHA(newBlock));
      newBlock.nonce++;
    }

    newBlock.hash = this.SHA(newBlock);

    this.chain.push(newBlock);
    this.pendingTransactions = [];
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
    this.pendingTransactions.push(new Transaction(fromAddress, toAddress, amount))
  }

  getTransactionsForAddress(address) {
    // Todo
  }

  toString() {
    console.log(JSON.stringify(this, null, 2));
  }
}

const blockchain = new Blockchain();

console.log("Adding transactions... ")
blockchain.createTransaction('Steven', 'Branko', '1')

console.log('Mining block...')
blockchain.mineBlock();
console.log('Mining block...')
blockchain.mineBlock();

blockchain.toString();


console.log("Blockchain is valid: ", blockchain.isValid())

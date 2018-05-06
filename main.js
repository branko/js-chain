const SHA256 = require('crypto-js/sha256');

class Block {
  constructor(timestamp, previousHash, data) {
    this.timestamp = timestamp;
    this.previousHash = previousHash;
    this.data = data;

    // this.hash = ;
  }
}

class Blockchain {
  constructor() {
    this.chain = [];
    this.difficulty = 1;

    const createGenesisBlock = () => {
      const gb = new Block('0', null, []);
      gb.hash = SHA256('hello world').toString();
      this.chain.push(gb);
    };

    createGenesisBlock();
  }

  mineBlock() {
    let nonce = 0;
    let hashStr;
    let str = `${gb.timestamp}${gb.previousHash}${gb.data}${nonce}`
    while (SHA256(str).substring(0, this.difficulty) !== Array(this.difficulty + 1).join('0')) {
      nonce++;
      str = `${gb.timestamp}${gb.previousHash}${gb.data}${nonce}`
    }
    let hashedString = SHA256(str).toString();
    let newBlock = new Block(Date.now(), this.chain[this.chain.length - 1].hash, 'fake data');

  }

  toString() {
    console.log(JSON.stringify(this, null, 2));
  }
}

const blockchain = new Blockchain();
blockchain.toString();

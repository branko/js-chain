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

module.exports = Block;
class Block {
  constructor(timestamp, previousHash, transactions) {
    this.timestamp = timestamp;
    this.previousHash = previousHash;
    this.transactions = transactions;
  }

  toString() {
    // return [`nonce: ${this.nonce}`,
    //         `hash: ${this.hash}`,
    //         "-------------\n\n"
    //         ].join('\n')

    return `Previous hash => ${this.previousHash}` + "\n" +
           `Timestamp => ${this.timestamp}` + "\n" +
           `Nonce => ${this.nonce}` + "\n" +
           `Hash => ${this.hash}` + "\n" +
           "\n=====================" + "\n\n"
  }

}

module.exports = Block;
class Transaction {
  constructor(timestamp, fromAddress, toAddress, amount) {
    this.timestamp = timestamp;
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
  }
}


module.exports = Transaction;

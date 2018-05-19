const RSA = require('../rsa');

class Transaction {
  constructor(fromAddress, toAddress, amount) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.timestamp = Date.now();
    this.signature = RSA.sign(JSON.stringify(this), RSA.getPrivateKey());
  }

  verify() {
    let message = {
      fromAddress: this.fromAddress,
      toAddress: this.toAddress,
      amount: this.amount,
      timestamp: this.timestamp
    }

    return RSA.verify( JSON.stringify(message),
                       this.fromAddress,
                       this.signature)
  }
}

module.exports = Transaction;
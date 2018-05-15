const crypto = require('crypto');
const exec = require('child_process').exec;
const fs = require('fs');

class RSA {
  static generateKeys() {

    let promise = new Promise(function(resolve, reject) {
      fs.mkdirSync('./keys');
      exec('openssl genrsa -out ./keys/privkey.pem 1024', 'utf8', () => {
        exec('openssl rsa -in ./keys/privkey.pem -pubout > ./keys/pubkey.pub', 'utf8', () => {
          resolve();
        });
      })
    })

    return promise
  }

  static getPrivateKey() {
    return fs.readFileSync('./keys/privkey.pem').toString();
  }

  static getPublicKey() {
    return fs.readFileSync('./keys/pubkey.pub').toString();
  }

  static sign(message, privateKey) {
    const sign = crypto.createSign('SHA256');
    sign.write(message);
    const signature = sign.sign(privateKey, 'hex');

    return signature
  }

  static verify(message, publicKey, signature) {
    const verify = crypto.createVerify('SHA256');
    verify.update(message);
    return verify.verify(publicKey, signature, 'hex')
  }
}

module.exports = RSA;

// Typical workflow:

// let privateKey = RSA.getPrivateKey();
// let publicKey = RSA.getPublicKey();

// let transaction = JSON.stringify({ fromAddress: publicKey, toAddress: "Steven", amount: 100 })
// let fakeTransaction = JSON.stringify({ fromAddress: publicKey, toAddress: "Steven", amount: 100 })

// let signature = RSA.sign(transaction, privateKey)

// console.log(RSA.verify(fakeTransaction, publicKey, signature))

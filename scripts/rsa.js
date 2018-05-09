// const forge = require('node-forge')

// const rsa = forge.pki.rsa;

// class RSA {
//   static generateKeyPair() {
//     const keypair = rsa.generateKeyPair({bits: 2048, e: 0x10001});

//     return keypair
//   }

//   static signTransaction(privateKey, transaction) {
//     let messageDigest = forge.md.sha1.create();
//     messageDigest.update(transaction, 'utf8');

//     let signature = privateKey.sign(messageDigest);
//     return signature
//   }

//   static verifyTransaction(transaction, publicKey, signature) {
//     let md = forge.md.sha1.create();

//     md.update(transaction, 'utf8');

//     let verified = publicKey.verify(md.digest().bytes(), signature);

//     return verified
//   }
// }

// module.exports = RSA;
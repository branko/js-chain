// Todo:

// validate transactions before mining
    // choosing which transactions to mine
// implement public/private keys
//
//

const Blockchain = require('./blockchain');

const blockchain = new Blockchain();

console.log("Adding transactions... ");
blockchain.createTransaction('Steven', 'Branko', 1);

console.log('Mining block...')
blockchain.mineBlock();
// console.log('Mining block...')
// blockchain.mineBlock();
//
// blockchain.toString();
// console.log("Blockchain is valid: ", blockchain.isValid());
// blockchain.createTransaction('Branko', 'Steven', 2);
// blockchain.mineBlock();
//
// console.log(blockchain.validTransactionsForAddress('Steven'));
// console.log(blockchain.getBalanceForAddress('Steven'));
// console.log(blockchain.getBalanceForAddress('Branko'));

// Todo:

// validate transactions before mining
    // choosing which transactions to mine
// implement public/private keys
//
//

const Blockchain = require('./blockchain');
const Block = require('./block');

const blockchain = new Blockchain();
const Cache = require('./cache');

blockchain.createTransaction('Steven', 'Branko', 1);
blockchain.mineBlock();
blockchain.createTransaction('Steven', 'Branko', 1);
blockchain.mineBlock();


// console.log('Mining block...')
// blockchain.mineBlock();
//
// blockchain.toString();
// console.log("Blockchain is valid: ", blockchain.isValid());
// blockchain.createTransaction('Branko', 'Steven', 2);
// blockchain.mineBlock();
//
// blockchain.createTransaction('Branko', 'Steven', 1);
// blockchain.mineBlock();
// blockchain.createTransaction('Branko', 'Steven', 2);
// blockchain.mineBlock();
// blockchain.createTransaction('Branko', 'Steven', 3);
// blockchain.mineBlock();
// console.log(blockchain.toString());

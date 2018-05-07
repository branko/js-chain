// Todo:

// validate transactions before mining
    // choosing which transactions to mine
// implement public/private keys
//
//

const Blockchain = require('./scripts/blockchain');
const Block = require('./scripts/block');

const blockchain = new Blockchain();
const Cache = require('./scripts/cache');

let counter = 1
while (counter <= 50) {
  blockchain.createTransaction('Steven', 'Branko', 0.001);
  blockchain.mineBlock();
  counter++
  console.log(counter)
}

// blockchain.createTransaction('Steven', 'Branko', 1);
// blockchain.mineBlock();


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

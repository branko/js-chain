const _ = require('underscore');
const Blockchain = require('./scripts/blockchain');
const RSA = require('./rsa');
const Cache = require('./scripts/cache');

process.stdout.write('\033c');

RSA.generateKeys().then(() => {

  let blockchain = new Blockchain();
  blockchain.chain = JSON.parse(Cache.readJSON()).chain;

  let publicKey = RSA.getPublicKey();
  let formattedKey = publicKey.match(/[a-z0-9]{32}/gi).join('\n')

  let transactions = blockchain.getOwnTransactions();
  let allTransactions = blockchain.getAllTransactions();
  let balance = blockchain.getOwnBalance();

  console.log("\n\n----------------------");
  console.log("Your transaction info:");
  console.log("----------------------\n\n\n");

  console.log(`Your public key is: \n\n${formattedKey}\n`)
  console.log(`You are part of ${transactions.length} transactions`)
  console.log(`Our of ${allTransactions.length} total transactions`)

  console.log("\n\nTransaction history (last 10 transactions):\n\n");

  console.log(transactions.slice(-10, transactions.length).map(t => {
    let date = new Date(t.timestamp)
    let dateString = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`
    t.fromAddress = t.fromAddress || 'Reward';
    let amountStr = t.fromAddress === publicKey ? `-$${t.amount}` : `+$${t.amount}`

    return `Date: ${dateString}, ${t.fromAddress.slice(0, 6)} => ${t.toAddress.slice(0, 6)}, Amount: ${amountStr}`
  }).join('\n'));

  console.log(`\n\nYour current balance is $${balance}`)
});









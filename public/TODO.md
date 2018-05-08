# Short term

- Implement rewards for miners
- Optimize blockchain.json size => Maybe don't mind blocks without transactions?
- Implement dynamic IP tracking of peer (blockchain.js).
- Put addresses in local .json and iterate over them to send posts after mining a block
- Broadcast transactions using "Signaling Server"
  - minimum transactions to begin mining
- Generate sk/pk using RSA
- Move validation to its own class and use as mixin?
- Add timestamps to transactions and hash transactionID
  - Also add timestamps to wallet#show in exchange

# Long term
- Add bootstrap to rails
- Make front end to interact with blockchain
- Migrate to Diglet instead of ngrok

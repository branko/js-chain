const fs = require('fs');

class Cache {
  static write(blockchain) {
    // if JSON doesnt exist, create one
    fs.writeFile("public/blockchain.json", blockchain, (err) => {
      if (err) {
        console.log(err)
      }
    });
  }

  static read() {
    return fs.readFileSync("public/blockchain.json");
  }

  static readJSON() {
    return JSON.stringify(JSON.parse(this.read()), null, 3);
  }
}

module.exports = Cache;

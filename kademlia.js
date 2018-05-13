const kadence = require('@kadenceproject/kadence');
const levelup = require('levelup');
const leveldown = require('leveldown');
const encode = require('encoding-down');
const ip = require("ip");
const CLI = require('./scripts/cli');

function startKademlia(identity, seed) {
  const node = new kadence.KademliaNode({
    identity: identity,
    transport: new kadence.HTTPTransport(),
    storage: levelup(encode(leveldown('./kademliaInfo'))),
    contact: {
      hostname: ip.address(),
      port: 4000
    }
  });

  node.once("join", function() {
   CLI.puts(`connected to ${node.router.size} peers`);
  });

  CLI.puts("Kadence node listening on port " + node.contact.port);
  node.listen(node.contact.port);

  node.once("error", function(err) {
   CLI.puts("failed to join the network", err);
  });

  if (seed) {
    node.join(seed);
  } else {
    CLI.puts('No seed found, you must be the first node!');
  }

  return node;
}

module.exports = startKademlia;

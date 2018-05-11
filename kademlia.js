const kadence = require('@kadenceproject/kadence');
const levelup = require('levelup');
const leveldown = require('leveldown');
const encode = require('encoding-down');
const ip = require("ip");

function startKademlia(identity, seed) {
  const kademliaNode = new kadence.KademliaNode({
    identity: identity,
    transport: new kadence.HTTPTransport(),
    storage: levelup(encode(leveldown('./kademliaInfo'))),
    contact: {
      hostname: ip.address(),
      port: 4000
    }
  });

  kademliaNode.once("join", function() {
   console.info(`connected to ${kademliaNode.router.size} peers`);
  });

  console.log("Listening on port " + kademliaNode.contact.port);
  kademliaNode.listen(kademliaNode.contact.port);

  kademliaNode.once("error", function(err) {
   console.error("failed to join the network", err);
  });

  if (seed) {
    kademliaNode.join(seed);
  } else {
    console.log('No seed found');
  }

  return kademliaNode;
}

module.exports = startKademlia;

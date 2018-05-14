const readline = require('readline')

class CLI {
  static puts(msg) {
    console.log('\n===> ' + msg + "\n")
  }

  static header(text) {
    let leadingSpace = new Array(20).join(' ')
    let banner = new Array(text.length + 3).join("=")
    console.log(leadingSpace + banner)
    console.log(leadingSpace + ' ' + text)
    console.log(leadingSpace + banner)
    console.log('')
  }
 }

module.exports = CLI



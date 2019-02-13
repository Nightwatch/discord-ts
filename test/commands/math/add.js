const commando = require('../../../')

module.exports = class AddNumbersCommand extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'add-numbers',
      aliases: ['add', 'add-nums'],
      description: 'Adds numbers together.',

      args: [
        {
          key: 'numbers',
          type: 'string'
        }
      ]
    })
  }

  async run(msg, args) {
    let total = 0
    let nums = args.numbers.split(' ')

    for (let num of nums) {
      num = Number(num)

      if (!isNaN(num)) {
        total += num
      } else {
        return msg.reply('Format: `add <number> <number> ...`')
      }
    }

    return msg.reply(`${nums.join(' + ')} = **${total}**`)
  }
}

import { CommandoMessage, Command, CommandoClient } from '../../..'

module.exports = class AddNumbersCommand extends Command {
  public constructor(client: CommandoClient) {
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

  public async run(msg: CommandoMessage, args: AddCommandArguments): Promise<void> {
    let total = 0
    const numberArray = args.numbers.split(' ')

    for (const numberString of numberArray) {
      const parsedNumber = Number(numberString)

      if (!isNaN(parsedNumber)) {
        total += parsedNumber
      } else {
        await msg.reply('Format: `add <number> <number> ...`')

        return
      }
    }

    await msg.reply(`${numberArray.join(' + ')} = **${total}**`)
  }
}

interface AddCommandArguments {
  /**
   * A string containing numbers separated by spaces
   */
  numbers: string
}

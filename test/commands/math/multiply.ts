import { Message, Command, Client } from '../../../src'

/**
 * Simple command to multiply numbers together
 */
// tslint:disable-next-line: no-default-export
export default class MultiplyNumbersCommand extends Command {
  public constructor(client: Client) {
    super(client, {
      name: 'multiply-numbers',
      aliases: ['multiply', 'mult'],
      description: 'Multiplies numbers together.',
      group: 'math',
      args: [
        {
          key: 'numbers',
          phrase: 'What numbers would you like to multiply?',
          type: 'string'
        }
      ]
    })
  }

  public async run(msg: Message, args: MultiplyCommandArguments): Promise<void> {
    let total = 1
    const numberArray = args.numbers.split(' ')

    for (const numberString of numberArray) {
      const parsedNumber = Number(numberString)

      if (!isNaN(parsedNumber)) {
        total *= parsedNumber
      } else {
        await msg.reply('Format: `multiply <number> <number> ...`')

        return
      }
    }

    await msg.reply(`${numberArray.join(' * ')} = **${total}**`)
  }
}

interface MultiplyCommandArguments {
  /**
   * A string containing numbers separated by spaces
   */
  numbers: string
}

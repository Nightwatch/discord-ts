import { Client, Command, Message } from '../../src'

/**
 * Custom command to handle unknown commands
 */
// tslint:disable-next-line: no-default-export
export default class UnknownCommand extends Command {
  public constructor(client: Client) {
    super(client, {
      name: 'unknown',
      description: 'Acts as a response to unknown commands.',
      unknown: true,
      args: [
        {
          key: 'commandName',
          phrase: 'What command are you wanting to run?',
          type: 'string'
        }
      ]
    })
  }

  /**
   * Executes the command
   * @param msg - The object containing the user's message
   * @param args - Arguments passed to the command
   */
  public async run(msg: Message, args: UnknownCommandArgs): Promise<void> {
    await msg.reply(`Unknown command \`${args.commandName}\`.`)
  }
}

interface UnknownCommandArgs {
  /**
   * The name of the command that was attempted
   */
  commandName: string
}

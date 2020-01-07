import { Command, Client, Message } from '../model'

/**
 * Handles when the user enters a command that does not exist
 */
// tslint:disable-next-line: no-default-export
export class UnknownCommand extends Command {
  public constructor(client: Client) {
    super(client, {
      name: 'unknown',
      description: 'Acts as a response to unknown commands.',
      group: 'info',
      unknown: true,
      default: true,
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
   * The name of the command the user entered
   */
  commandName: string
}

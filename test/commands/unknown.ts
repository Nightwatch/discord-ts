import { CommandoClient, Command, CommandoMessage } from '../../src/commando-lite'

module.exports = class UnknownCommand extends Command {
  public constructor(client: CommandoClient) {
    super(client, {
      name: 'unknown',
      description: 'Acts as a response to unknown commands.',
      unknown: true,
      args: [
        {
          key: 'cmd',
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
  public async run(msg: CommandoMessage, args: UnknownCommandArgs): Promise<void> {
    await msg.reply(`Unknown command \`${args.commandName}\`.`)
  }
}

interface UnknownCommandArgs {
  /**
   * The name of the command that was attempted
   */
  commandName: string
}

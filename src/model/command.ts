import { CommandoClient, CommandoMessage, CommandOptions } from '.'

/**
 * A command for your bot.
 *
 * Give it some information, and control how it executes (and who can execute it).
 *
 * @example
 * ```ts
 * export class EchoCommand extends Command {
 *   constructor(client: CommandoClient) {
 *     super(client, {
 *       name: 'echo',
 *       description: 'Make me repeat something!',
 *       args: [
 *         {
 *           key: 'phrase',
 *           phrase: 'What should I echo?',
 *           type: 'string'
 *         }
 *       ]
 *     })
 *   }
 *
 *   public async run(msg: CommandoMessage, args: {phrase: string}) {
 *     await msg.reply(args.phrase)
 *   }
 * }
 * ```
 */
export abstract class Command {
  /**
   * Find a command by name or alias.
   *
   * @param client - The parent client object
   * @param name - The name of the command, e.g. `echo`
   */
  public static find(client: CommandoClient, name: string): Command | undefined {
    return client.commands.find(
      x => x.options.name === name || (!!x.options.aliases && x.options.aliases.includes(name))
    )
  }

  /**
   * The client object that stores all command information.
   */
  public readonly client: CommandoClient

  /**
   * The options for the command, e.g. `name`, `description`, etc.
   */
  public readonly options: CommandOptions

  public constructor(client: CommandoClient, options: CommandOptions) {
    this.options = options
    this.client = client
  }

  /**
   * Checks if the user has permission to run this command.
   *
   * @param msg - The message object
   */
  public async hasPermission(msg: CommandoMessage): Promise<boolean> {
    return true
  }

  /**
   * Executes the command.
   *
   * @param msg - The message object.
   * @param args - An optional object containing the args from the CommandOptions that were passed in the constructor. E.g. for an `echo` command, you would use `args.phrase` to get the phrase to echo.
   */
  public abstract async run(msg: CommandoMessage, args?: {}): Promise<unknown>
}

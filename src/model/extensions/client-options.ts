import { ClientOptions as DiscordJsClientOptions, ColorResolvable } from 'discord.js'

/**
 * Extension of the Discord.js ClientOptions
 *
 * @see https://discord.js.org/#/docs/main/master/typedef/ClientOptions
 */
export interface ClientOptions extends DiscordJsClientOptions {
  /**
   * The main color of your bot. Will be used in some built in commands.
   */
  color?: ColorResolvable

  /**
   * The prefix that all commands will use. If an array, there will be multiple prefixes.
   *
   * e.g. `?` will require all commands start with `?`, like `?help`, `?echo <phrase>`, etc.
   */
  commandPrefix: string | string[]

  /**
   * Your Discord user ID. The bot will use this to identify you as the bot owner.
   */
  ownerId: string
}

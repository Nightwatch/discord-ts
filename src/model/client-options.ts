import { ClientOptions } from 'discord.js'

export interface CommandoClientOptions extends ClientOptions {
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

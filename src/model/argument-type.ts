import { GuildMemberResolvable } from 'discord.js'

/**
 * The type of the argument.
 */
export interface ArgumentType {
  /**
   * Requires the argument to be a numeric value
   */
  number: number
  /**
   * Accepts any value
   */
  string: string
  /**
   * Requires the argument to be a user mention
   */
  user: GuildMemberResolvable
}

import { DMChannel, Message as DiscordJsMessage, TextChannel } from 'discord.js'
import { Client } from '..'
import { Command } from '../command'

/**
 * Subclass of the Discord.js Message class.
 *
 * @see https://discord.js.org/#/docs/main/master/class/Message
 */
export class Message extends DiscordJsMessage {
  /**
   * The command that was ran.
   */
  public command?: Command

  public constructor(channel: DMChannel | TextChannel, data: object, client: Client) {
    super(channel, data, client)
  }
}

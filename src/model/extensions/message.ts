import { DMChannel, Message as DiscordJsMessage, TextChannel } from 'discord.js'
import { Command } from '..'
import { Client } from '.'

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

  public constructor(
    public readonly channel: DMChannel | TextChannel,
    public readonly data: object,
    public readonly client: Client
  ) {
    super(channel, data, client)
  }
}

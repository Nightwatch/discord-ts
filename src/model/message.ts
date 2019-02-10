import { DMChannel, GroupDMChannel, Message, TextChannel } from 'discord.js'
import { CommandoClient } from '.'
import { Command } from './command'

/**
 *  Subclass of the Discord.js Message class.
 *
 * @todo
 */
export class CommandoMessage extends Message {
  /**
   * The base client object.
   */
  public client: CommandoClient

  /**
   * The command that was ran.
   */
  public command: Command

  /**
   * The parent Discord.js Message object
   */
  public message: Message

  public constructor(message: Message, command: Command) {
    super(message.client, message, message.channel)
    this.message = message
    this.command = command
    this.client = command.client
  }
}

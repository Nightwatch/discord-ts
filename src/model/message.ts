import { DMChannel, GroupDMChannel, Message, Structures, TextChannel } from 'discord.js'
import { CommandoClient } from '.'
import { Command } from './command'

Structures.extend('Message', () => CommandoMessage)

/**
 * Subclass of the Discord.js Message class.
 */
export class CommandoMessage extends Message {
  /**
   * The command that was ran.
   */
  public command: Command | undefined = undefined

  public constructor(
    client: CommandoClient,
    data: object,
    channel: DMChannel | TextChannel | GroupDMChannel
  ) {
    super(client, data, channel)
  }
}

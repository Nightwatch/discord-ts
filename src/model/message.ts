import { DMChannel, GroupDMChannel, Message, TextChannel } from 'discord.js'
import { CommandoClient } from '.'

/**
 *  Subclass of the Discord.js Message class.
 *
 * @todo
 */
export class CommandoMessage extends Message {
  /**
   * The parent client object.
   */
  public readonly client: CommandoClient

  public constructor(
    client: CommandoClient,
    data: object,
    channel: DMChannel | TextChannel | GroupDMChannel
  ) {
    super(client, data, channel)
    this.client = client
  }
}

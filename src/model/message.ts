import { Message, DMChannel, TextChannel, GroupDMChannel } from 'discord.js'
import { CommandoClient } from '.'

export class CommandoMessage extends Message {
  constructor(
    client: CommandoClient,
    data: object,
    channel: DMChannel | TextChannel | GroupDMChannel
  ) {
    super(client, data, channel)
  }
}

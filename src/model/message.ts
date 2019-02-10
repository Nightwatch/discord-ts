import { Message, DMChannel, TextChannel, GroupDMChannel, Structures } from 'discord.js'
import { CommandoClient } from '.'

Structures.extend('Message', () => {
  return CommandoMessage
})

export class CommandoMessage extends Message {
  constructor(
    client: CommandoClient,
    data: object,
    channel: DMChannel | TextChannel | GroupDMChannel
  ) {
    super(client, data, channel)
  }
}

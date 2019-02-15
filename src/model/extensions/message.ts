import { DMChannel, Message as DiscordJsMessage, Structures, TextChannel } from 'discord.js'
import { Client } from '..'
import { Command } from '../command'

/**
 * Subclass of the Discord.js Message class.
 */
export class Message extends DiscordJsMessage {
  /**
   * The command that was ran.
   */
  public command?: Command

  public constructor(client: Client, data: object, channel: DMChannel | TextChannel) {
    super(client, data, channel)
  }
}

Structures.extend('Message', () => Message)

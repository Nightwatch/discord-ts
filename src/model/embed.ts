import { MessageEmbed, MessageEmbedOptions } from 'discord.js'
import { CommandoClient } from './client'

/**
 * Extension of the Discord.js MessageEmbed.
 *
 * Sets default values make implementation easier.
 */
export class CommandoEmbed extends MessageEmbed {
  /**
   * Creates an embed to make your messages look fancier.
   *
   * @param client - The main CommandoClient instance
   * @param options - Optional settings for the embed
   */
  public constructor(client: CommandoClient, options?: MessageEmbedOptions) {
    super(options)

    this.setColor('GREEN')
    this.setTimestamp(new Date())
    this.setFooter(client.user.username)
  }
}

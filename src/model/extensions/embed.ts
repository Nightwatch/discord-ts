import { RichEmbed, MessageEmbed as DiscordEmbed, RichEmbedOptions } from 'discord.js'
import { Client } from './client'

/**
 * Extension of the Discord.js MessageEmbed.
 *
 * Sets default values make implementation easier.
 *
 * @see https://discord.js.org/#/docs/main/master/class/MessageEmbed
 */
export class MessageEmbed extends RichEmbed {
  /**
   * Creates an embed to make your messages look fancier.
   *
   * @param client - The main Client instance
   * @param options - Optional settings for the embed
   */
  public constructor(client: Client, options?: DiscordEmbed | RichEmbedOptions) {
    super(options)

    this.setColor(client.options.color || 'GREEN')
    this.setTimestamp(new Date())
    this.setFooter(client.user ? client.user.username : '')
  }
}

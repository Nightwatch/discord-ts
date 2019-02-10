import { ClientOptions } from 'discord.js'

export interface CommandoClientOptions extends ClientOptions {
  ownerId: string
  commandPrefix: string
}

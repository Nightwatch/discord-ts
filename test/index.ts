// tslint:disable:no-console

import { Client } from '../src'
import * as path from 'path'
// tslint:disable-next-line: no-unsafe-any no-require-imports no-var-requires
const config = require('./auth') as Config

interface Config {
  /**
   * Your Discord user ID
   */
  ownerId: string
  /**
   * The bot token
   */
  token: string
}

/**
 * The main bot class. I am important.
 */
class Bot {
  /**
   * The command handler
   */
  public client: Client

  /**
   * Creates an instance of the bot and registers events
   */
  public constructor() {
    this.client = new Client({
      commandPrefix: ['c.', 'c!'],
      ownerId: config.ownerId
    })

    this.client
      .on('error', error => {
        console.error(error)
      })
      .on('warn', message => {
        console.warn(message)
      })
      .on('ready', () => {
        if (this.client.user) {
          console.log(
            `Client ready; logged in as ${this.client.user.username}#${
              this.client.user.discriminator
            } (${this.client.user.id})`
          )
        }
      })
      .on('disconnect', () => {
        console.warn('Disconnected!')
      })
      .on('reconnecting', () => {
        console.warn('Reconnecting...')
      })
  }

  /**
   * Starts the bot
   */
  public async start(): Promise<void> {
    this.client.registerDefaultCommands()
    await this.client.registerCommandsIn(path.join(__dirname, 'commands'))
    await this.client.login(config.token)
  }
}

new Bot()
  .start()
  .then(() => {
    console.log('uwu')
  })
  .catch(error => {
    console.error(error)
  })

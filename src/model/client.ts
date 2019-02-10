import { Client } from 'discord.js'
import { CommandoClientOptions, Command } from '.'

export class CommandoClient extends Client {
  public readonly options: CommandoClientOptions
  public commands: ReadonlyMap<string, Command> = new Map()

  constructor(options: CommandoClientOptions) {
    super(options)

    this.options = options
  }

  public async registerCommandsIn(paths: string | string[]) {}
}

import { Client } from 'discord.js'
import { CommandoClientOptions, Command } from '.'

export class CommandoClient extends Client {
  public readonly options: CommandoClientOptions
  public commands: Map<string, Command> = new Map()

  constructor(options: CommandoClientOptions) {
    super(options)

    this.options = options
  }

  public registerCommandsIn(paths: string | string[]) {
    if (typeof paths === 'string') {
      this.resolveCommand(paths)
      return
    }

    paths.forEach(path => {
      this.resolveCommand(path)
    })
  }

  private resolveCommand(path: string) {
    const command = require(path) as Command

    if (this.commands.has(command.options.name)) {
      throw new Error(
        `Command '${
          command.options.name
        }' is already registered. Do you have two commands with the same name?`
      )
    }

    this.commands.set(command.options.name, command)
  }
}

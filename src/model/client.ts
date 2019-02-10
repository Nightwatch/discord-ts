import { Client } from 'discord.js'
import { CommandoClientOptions, Command } from '.'
import { promises as fs } from 'fs'
import * as path from 'path'

export class CommandoClient extends Client {
  public readonly options: CommandoClientOptions
  public commands: Map<string, Command> = new Map()

  constructor(options: CommandoClientOptions) {
    super(options)

    this.options = options
  }

  public registerCommandsIn(path: string | string[]) {
    if (typeof path === 'string') {
      return walk(path).then(files => {
        files.forEach(file => {
          this.resolveCommand(file)
        })
      })
    }

    return path.forEach(async p => {
      const files = await walk(p)
      files.forEach(file => {
        this.resolveCommand(file)
      })
    })
  }

  public registerCommand(command: Command) {
    if (this.commands.has(command.options.name)) {
      throw new Error(
        `Command '${
          command.options.name
        }' is already registered. Do you have two commands with the same name?`
      )
    }

    this.commands.set(command.options.name, command)
  }

  private resolveCommand(path: string) {
    try {
      const command = require(path) as Command
      this.registerCommand(command)
    } catch {
      // swallow
    }
  }
}

// from https://gist.github.com/kethinov/6658166#gistcomment-2733303
const walk = async (dir: string, fileList: string[] = []) => {
  const files = await fs.readdir(dir)

  for (const file of files) {
    const filepath = path.join(dir, file)
    const stat = await fs.stat(filepath)

    if (stat.isDirectory()) {
      fileList = await walk(filepath, fileList)
    } else {
      fileList.push(file)
    }
  }

  return fileList
}

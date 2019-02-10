import { Client, Message, Guild } from 'discord.js'
import { CommandoClientOptions, Command } from '.'
import { promises as fs } from 'fs'
import * as path from 'path'
import { ArgumentType } from './argument-type'

export class CommandoClient extends Client {
  public readonly options: CommandoClientOptions
  public commands: Map<string, Command> = new Map()

  constructor(options: CommandoClientOptions) {
    super(options)

    this.options = options

    this.on('message', this.onMessage)
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

  private async onMessage(msg: Message) {
    if (msg.author.bot) {
      return
    }

    if (!msg.content.startsWith(this.options.commandPrefix)) {
      return
    }

    const withoutPrefix = msg.content.slice(this.options.commandPrefix.length)
    const split = withoutPrefix.split(' ')
    const commandName = split[0]
    const args = split.slice(1)

    let command = this.getCommandByNameOrAlias(commandName)

    if (!command) {
      // TODO: Handle non commands, optionally
      return
    }

    if (command.options.args) {
      return this.runCommandWithArgs(msg, command, args)
    }

    return this.runCommand(msg, command)
  }

  private getFormattedArgs(command: Command, args: string[]) {
    let formattedArgs = args

    if (args.length > command.options.args!.length) {
      const formattedArgStartIndex = command.options.args!.length - 1
      const combinedFinalArg = args.slice(formattedArgStartIndex).join(' ')
      const newArgs = args.slice(0, formattedArgStartIndex)
      newArgs.push(combinedFinalArg)
      formattedArgs = newArgs
    }

    return formattedArgs
  }

  private getCommandByNameOrAlias(name: string) {
    const command = Command.find(this, name)

    if (command) {
      return command
    }

    const iterator = this.commands.values()

    for (let i = 0; i < this.commands.size; i++) {
      const command = iterator.next().value
      if (!command.options.aliases) {
        continue
      }

      if (command.options.aliases.find(x => x === name)) {
        return command
      }
    }
  }

  private async validateArgs(msg: Message, command: Command, args: string[]) {
    for (let i = 0; i < args.length; i++) {
      const expectedType = command.options.args![i].type

      if (Array.isArray(expectedType)) {
        let foundType = false
        for (const t of expectedType) {
          if (this.validateType(msg, t, args[i])) {
            foundType = true
            break
          }
        }
        if (!foundType) {
          await msg.reply(`Argument type mismatch at '${args[i]}'`)
          return false
        }
        return true
      }

      if (!this.validateType(msg, expectedType, args[i])) {
        await msg.reply(`Argument type mismatch at '${args[i]}'`)
        return false
      }
    }
    return true
  }

  private validateType(msg: Message, expected: ArgumentType, value: string): boolean {
    switch (expected) {
      case 'number':
        return !!Number(value)
      case 'user':
        if (!msg.guild) {
          return false
        }
        return !!this.getMemberFromMention(msg.guild, value)
      default:
        return true
    }
  }

  // source: https://github.com/discordjs/guide/blob/master/guide/miscellaneous/parsing-mention-arguments.md
  private getMemberFromMention(guild: Guild, mention: string) {
    if (!mention) return

    if (mention.startsWith('<@') && mention.endsWith('>')) {
      mention = mention.slice(2, -1)

      if (mention.startsWith('!')) {
        mention = mention.slice(1)
      }

      return guild.members.get(mention)
    }
  }

  private mapArgsToObject(command: Command, args: string[]) {
    return command.options.args!.reduce((p, c, i) => ({ [c.key]: args[i] }), {})
  }

  private async runCommandWithArgs(msg: Message, command: Command, args: string[]) {
    if (command.options.args!.length > args.length) {
      await msg.reply(`Insufficient arguments. Expected ${command.options.args!.length}.`) // TODO: Make this better. Maybe a pretty embed as well?
      return
    }

    const formattedArgs = this.getFormattedArgs(command, args)

    const argsValid = this.validateArgs(msg, command, formattedArgs)

    if (!argsValid) {
      return
    }

    const argsObject = this.mapArgsToObject(command, formattedArgs)

    return this.runCommand(msg, command, argsObject)
  }

  private async runCommand(msg: Message, command: Command, args?: object) {
    if (!command.hasPermission(msg)) {
      return
    }

    return command.run(msg, args)
  }
}

// source: https://gist.github.com/kethinov/6658166#gistcomment-2733303
async function walk(dir: string, fileList: string[] = []) {
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

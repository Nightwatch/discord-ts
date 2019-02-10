import { Client, Guild, GuildMember, Message } from 'discord.js'
import { promises as fs } from 'fs'
import * as path from 'path'
import { Command, CommandoClientOptions } from '.'
import { ArgumentType } from './argument-type'

export class CommandoClient extends Client {
  public commands: Map<string, Command> = new Map()
  public readonly options: CommandoClientOptions

  public constructor(options: CommandoClientOptions) {
    super(options)

    this.options = options

    this.on('message', async (msg: Message) => {
      await this.onMessage(msg)
    })
  }

  public registerCommand(command: Command): void {
    if (this.commands.has(command.options.name)) {
      throw new Error(
        `Command '${
          command.options.name
        }' is already registered. Do you have two commands with the same name?`
      )
    }

    this.commands.set(command.options.name, command)
  }

  public async registerCommandsIn(path: string | string[]): Promise<void> {
    if (typeof path === 'string') {
      return walk(path).then(files => {
        files.forEach((file: string) => {
          this.resolveCommand(file)
        })
      })
    }

    path.forEach(async (p: string) => {
      const files: string[] = await walk(p)
      files.forEach((file: string) => {
        this.resolveCommand(file)
      })
    })
  }

  private getCommandByNameOrAlias(name: string): Command | undefined {
    const commandByName: Command | undefined = Command.find(this, name)

    if (commandByName) {
      return commandByName
    }

    const iterator: IterableIterator<Command> = this.commands.values()

    for (let i = 0; i < this.commands.size; i++) {
      const commandByAlias = iterator.next().value
      if (!commandByAlias.options.aliases) {
        continue
      }

      if (commandByAlias.options.aliases.find(x => x === name)) {
        return commandByAlias
      }
    }
  }

  private getFormattedArgs(command: Command, args: string[]): string[] {
    let formattedArgs = args

    if (!command.options.args) {
      return args
    }

    if (args.length > command.options.args.length) {
      const formattedArgStartIndex = command.options.args.length - 1
      const combinedFinalArg = args.slice(formattedArgStartIndex).join(' ')
      const newArgs = args.slice(0, formattedArgStartIndex)
      newArgs.push(combinedFinalArg)
      formattedArgs = newArgs
    }

    return formattedArgs
  }

  // source: https://github.com/discordjs/guide/blob/master/guide/miscellaneous/parsing-mention-arguments.md
  private getMemberFromMention(guild: Guild, mention: string): GuildMember | undefined {
    if (!mention) {
      return undefined
    }

    if (mention.startsWith('<@') && mention.endsWith('>')) {
      mention = mention.slice(2, -1)

      if (mention.startsWith('!')) {
        mention = mention.slice(1)
      }

      return guild.members.get(mention)
    }
  }

  private mapArgsToObject(command: Command, args: string[]): object | undefined {
    if (!command.options.args) {
      return undefined
    }

    return command.options.args.reduce((p, c, i) => ({ [c.key]: args[i] }), {})
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

    const command = this.getCommandByNameOrAlias(commandName)

    if (!command) {
      // TODO: Handle non commands, optionally
      return
    }

    if (command.options.args) {
      return this.runCommandWithArgs(msg, command, args)
    }

    return this.runCommand(msg, command)
  }

  private resolveCommand(path: string) {
    try {
      const command = require(path) as Command
      this.registerCommand(command)
    } catch {
      // swallow
    }
  }

  private async runCommand(msg: Message, command: Command, args?: object) {
    if (!command.hasPermission(msg)) {
      return
    }

    return command.run(msg, args)
  }

  private async runCommandWithArgs(msg: Message, command: Command, args: string[]) {
    if (!command.options.args) {
      return this.runCommand(msg, command)
    }

    if (command.options.args.length > args.length) {
      await msg.reply(`Insufficient arguments. Expected ${command.options.args.length}.`) // TODO: Make this better. Maybe a pretty embed as well?

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

  private async validateArgs(msg: Message, command: Command, args: string[]): Promise<boolean> {
    for (let i = 0; i < args.length; i++) {
      if (!command.options.args) {
        continue
      }

      const expectedType = command.options.args[i].type

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
}

// source: https://gist.github.com/kethinov/6658166#gistcomment-2733303
async function walk(dir: string, fileList: string[] = []): Promise<string[]> {
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

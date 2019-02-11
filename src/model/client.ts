import { Client, Guild, GuildMember, Message, Util } from 'discord.js'
import { promises as fs } from 'fs'
import * as path from 'path'
import { ArgumentType, Command, CommandoClientOptions, CommandoMessage, DefaultOptions } from '.'

/**
 * Extension of the Discord.js Client.
 *
 * Contains extra methods and properties for managing commands.
 */
export class CommandoClient extends Client {
  /**
   * Holds all of the registered commands.
   */
  public commands: Map<string, Command> = new Map()

  /**
   * The ClientOptions which were passed in the constructor.
   */
  public readonly options: CommandoClientOptions

  public constructor(options: CommandoClientOptions) {
    super(Util.mergeDefault(DefaultOptions, options))

    this.options = options

    this.on('message', async (msg: CommandoMessage) => this.onMessage(msg))
  }

  /**
   * Calls a callback when a message containing a command is processed.
   * @param callback The function to call on the message
   */
  public onCommand(callback: (msg: CommandoMessage, cmd: Command, prefix: string) => void): void {
    this.on('command', callback)
  }

  /**
   * Calls a callback when a message starting with a prefix but not matching a command is sent.
   * @param callback The function to call on the invalid command
   */
  public onInvalidCommand(callback: (msg: CommandoMessage) => void): void {
    this.on('invalidCommand', callback)
  }

  /**
   * Register a command object
   * @param command - The command object
   */
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

  /**
   * Recursively finds all commands in a directory and registers them.
   *
   * @param filePath - The directory that contains commands.
   */
  public async registerCommandsIn(filePath: string | string[]): Promise<void> {
    if (typeof filePath === 'string') {
      return walk(filePath).then(files => {
        files.forEach(async (file: string) => {
          await this.resolveCommand(
            `${filePath}${filePath.endsWith('\\') || filePath.endsWith('/') ? '' : '/'}${file}`
          )
        })
      })
    }

    filePath.forEach(async (p: string) => {
      const files: string[] = await walk(p)
      files.forEach(async (file: string) => {
        await this.resolveCommand(`${p}${p.endsWith('\\') || p.endsWith('/') ? '' : '/'}${file}`)
      })
    })
  }

  /**
   * Converts a string to a given argument type
   * @param from - The string value given by the user.
   * @param to - The expected type.
   * @param guild - The guild the command was from.
   */
  private convertArgToType(
    from: string,
    to: ArgumentType | ArgumentType[],
    guild?: Guild
  ): string | number | GuildMember | undefined {
    const convert = (toType: ArgumentType) => {
      switch (toType) {
        case 'number':
          return Number(from)
        case 'user':
          if (!guild) {
            return undefined
          }

          return this.getMemberFromMention(guild, from)
        default:
          return from
      }
    }

    if (Array.isArray(to)) {
      for (const t of to) {
        const converted = convert(t)

        if (converted) {
          return converted
        }
      }

      return undefined
    }

    return convert(to)
  }

  /**
   * Finds a command by its name or an alias of the command.
   *
   * @param name - The command name to search.
   */
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

  /**
   * Converts the user arguments to an array with the same length as the expected arguments array.
   *
   * @param command - The command object.
   * @param args - The array of arguments provided by the user.
   */
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

  /**
   * Returns a GuildMember from a mention.
   *
   * @param guild - The guild the mention came from.
   * @param mention - The user mention.
   */
  private getMemberFromMention(guild: Guild, mention: string): GuildMember | undefined {
    // source: https://github.com/discordjs/guide/blob/master/guide/miscellaneous/parsing-mention-arguments.md

    if (!mention) {
      return undefined
    }

    let id: string

    if (mention.startsWith('<@') && mention.endsWith('>')) {
      id = mention.slice(2, -1)

      if (id.startsWith('!')) {
        id = mention.slice(1)
      }

      return guild.members.get(id)
    }
  }

  /**
   * Handles exceptions generated from command execution.
   */
  private async handleCommandError(msg: CommandoMessage, err: Error): Promise<void> {
    // tslint:disable-next-line: no-non-null-assertion
    const owner = this.users.get(this.options.ownerId)!
    const ownerDisplayString = `${owner.username}#${owner.discriminator}`
    await msg
      .reply(
        // tslint:disable-next-line: no-non-null-assertion
        `An error occurred during the execution of the \`${msg.command!.options.name}\` command: ${
          err.message
        }\n\nYou should never see this. Please contact ${ownerDisplayString}.`
      )
      .catch(_ => {
        // swallow
      })
  }

  /**
   * Converts an array of arguments to an object key/value store with the designated type from the command args.
   *
   * @param command - The command object.
   * @param args - The formatted argument string array.
   */
  private mapArgsToObject(msg: CommandoMessage, args: string[]): object | undefined {
    if (!msg.command || !msg.command.options.args) {
      return undefined
    }

    return msg.command.options.args.reduce(
      (_, c, i) => ({ [c.key]: this.convertArgToType(args[i], c.type, msg.guild) }),
      {}
    )
  }

  /**
   * Handles when a user sends a message.
   *
   * @param msg - CommandoMessage object
   */
  private async onMessage(msg: CommandoMessage): Promise<void> {
    if (msg.author.bot) {
      return
    }

    let prefix: string | undefined

    if (typeof this.options.commandPrefix === 'string') {
      if (!msg.content.startsWith(this.options.commandPrefix)) {
        return
      }

      prefix = this.options.commandPrefix
    } else {
      for (const pref of this.options.commandPrefix) {
        if (msg.content.startsWith(pref)) {
          prefix = pref
          break
        }
      }

      if (prefix === undefined) {
        return
      }
    }

    const withoutPrefix = msg.content.slice(prefix.length)
    const split = withoutPrefix.split(' ')
    const commandName = split[0]
    const args = split.slice(1)

    const command = this.getCommandByNameOrAlias(commandName)

    if (!command) {
      this.emit('invalidCommand', msg)

      return
    }

    this.emit('command', msg, command, prefix)

    msg.command = command

    if (command.options.args) {
      return this.runCommandWithArgs(msg, args)
    }

    return this.runCommand(msg)
  }

  /**
   * Tries to get command from a single file.
   *
   * @param filePath - Absolute path of command file.
   */
  private async resolveCommand(filePath: string): Promise<void> {
    try {
      const ResolvableCommand = await import(filePath)

      // tslint:disable-next-line: no-unsafe-any
      const instance: Command = new ResolvableCommand(this)

      this.registerCommand(instance)
    } catch (err) {
      // swallow
    }
  }

  /**
   * Wrapper method to execute a command. Checks permission and handles exceptions.
   *
   * @param msg - The message object.
   * @param command - The command object to be ran.
   * @param args - Command args.
   */
  private async runCommand(msg: CommandoMessage, args?: object): Promise<void> {
    if (!msg.command) {
      return
    }

    if (!msg.command.hasPermission(msg)) {
      await msg.reply(
        `You do not have permission to use the \`${msg.command.options.name}\` command.`
      )

      return
    }

    return msg.command.run(msg, args).catch(async (err: Error) => this.handleCommandError(msg, err))
  }

  /**
   * Helper method to validate args and run command with args.
   * @param msg - The message object.
   * @param command - The command object to be ran.
   * @param args - Command args.
   */
  private async runCommandWithArgs(msg: CommandoMessage, args: string[]): Promise<void> {
    if (!msg.command) {
      return
    }

    if (!msg.command.options.args) {
      return this.runCommand(msg)
    }

    if (msg.command.options.args.length > args.length) {
      await msg.reply(`Insufficient arguments. Expected ${msg.command.options.args.length}.`) // TODO: Make this better. Maybe a pretty embed as well?

      return
    }

    const formattedArgs = this.getFormattedArgs(msg.command, args)

    const argsValid = this.validateArgs(msg, formattedArgs)

    if (!argsValid) {
      return
    }

    const argsObject = this.mapArgsToObject(msg, formattedArgs)

    return this.runCommand(msg, argsObject)
  }

  /**
   * Validates user arguments against required command arguments.
   *
   * @param msg - The message object.
   * @param command - The command object.
   * @param args - The arguments provided by the user.
   */
  private async validateArgs(msg: CommandoMessage, args: string[]): Promise<boolean> {
    if (!msg.command) {
      return false
    }

    for (let i = 0; i < args.length; i++) {
      if (!msg.command.options.args) {
        continue
      }

      const expectedType = msg.command.options.args[i].type

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

  /**
   * Validates a value against a single type
   * @param msg - The message object.
   * @param expected - The expected type.
   * @param value - The value from the user.
   */
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
/**
 * Gets all files in directory, recursively.
 */
async function walk(dir: string, fileListArg: string[] = []): Promise<string[]> {
  const files = await fs.readdir(dir)
  let fileList = fileListArg

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

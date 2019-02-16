import { Client as DiscordJsClient, Guild, GuildMember, Util, Collection } from 'discord.js'
import { promises as fs } from 'fs'
import * as path from 'path'
import { HelpCommand } from '../../commands'
import { ArgumentType, Command, ClientOptions, Message, Event } from '..'
import { DefaultOptions } from '../constants'

/**
 * Extension of the Discord.js Client.
 *
 * Contains extra methods and properties for managing commands.
 */
export class Client extends DiscordJsClient {
  /**
   * Holds all of the registered commands.
   */
  public commands: Collection<string, Command> = new Collection()

  /**
   * The ClientOptions which were passed in the constructor.
   */
  public readonly options: ClientOptions

  /**
   * The command to run whenever an unknown command is ran.
   */
  public unknownCommand?: Command

  public constructor(options: ClientOptions) {
    super(Util.mergeDefault(DefaultOptions, options))

    this.options = options

    this.on('message', async (msg: Message) => this.onMessage(msg))
  }

  /**
   * Calls a callback when a message containing a command is processed.
   *
   * @param callback The function to call on the message
   */
  public onCommand(callback: (msg: Message, cmd: Command, prefix: string) => void): void {
    this.on(Event.COMMAND_RUN, callback)
  }

  /**
   * Calls a callback when a message starting with a prefix but not matching a command is sent.
   *
   * @param callback The function to call on the invalid command
   */
  public onInvalidCommand(callback: (msg: Message) => void): void {
    this.on(Event.INVALID_COMMAND, callback)
  }

  /**
   * Register a command object
   *
   * @param command - The command object
   */
  public registerCommand(command: Command): void {
    const duplicate = this.findDuplicate(command)

    if (duplicate) {
      throw new TypeError(
        `Unable to register command '${command.options.name}'. I've already registered a command '${
          duplicate.options.name
        }' which either has the same name or shares an alias.`
      )
    }

    this.validateUnregisteredCommandArguments(command)

    this.commands.set(command.options.name, command)

    if (command.options.unknown) {
      if (this.unknownCommand) {
        throw new TypeError(
          `Command ${this.unknownCommand.options.name} is already the unknown command, ${
            command.options.name
          } cannot also be it.`
        )
      }

      this.unknownCommand = command
    }
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
          await this.resolveCommand(path.join(filePath, file))
        })
      })
    }

    filePath.forEach(async (p: string) => {
      const files: string[] = await walk(p)
      files.forEach(async (file: string) => {
        await this.resolveCommand(path.join(p, file))
      })
    })
  }

  /**
   * Registers the built-in commands.
   *
   * @param options Allows you to disable certain default commands.
   */
  public registerDefaultCommands(options = { help: true }): void {
    if (options.help) {
      this.registerCommand(new HelpCommand(this))
    }
  }

  /**
   * Converts a string to a given argument type.
   *
   * @param from - The string value given by the user.
   * @param to - The expected type.
   * @param guild - The guild the command was from.
   */
  private convertArgToType<K extends keyof ArgumentType>(
    from: string,
    to: K | K[],
    guild?: Guild
  ): ArgumentType[K] | undefined {
    const convert = (toType: K) => {
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
   * This ensures no commands/aliases with the same name are registered.
   *
   * @param command The command to check against all other commands.
   */
  private findDuplicate(command: Command): Command | void {
    const commandSameName = Command.find(this, command.options.name)

    if (commandSameName) {
      return commandSameName
    }

    if (!command.options.aliases) {
      return undefined
    }

    for (const alias of command.options.aliases) {
      const commandSameAlias = Command.find(this, alias)

      if (commandSameAlias) {
        return commandSameAlias
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
   * Gets the prefix used by the user (in case an array was used)
   *
   * @param msg - The CommandMessage representing the user's message
   */
  private getPrefixFromMessage(msg: Message): string {
    let prefix = ''

    if (msg.channel.type === 'dm') {
      prefix = ''
    } else if (typeof this.options.commandPrefix === 'string') {
      prefix = this.options.commandPrefix
    } else {
      for (const prefixOption of this.options.commandPrefix) {
        if (msg.content.startsWith(prefixOption)) {
          prefix = prefixOption
          break
        }
      }
    }

    return prefix
  }

  /**
   * Handles exceptions generated from command execution.
   */
  private async handleCommandError(msg: Message, err: Error): Promise<void> {
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
  private mapArgsToObject(msg: Message, args: string[]): object | undefined {
    if (!msg.command || !msg.command.options.args) {
      return undefined
    }

    return msg.command.options.args.reduce(
      (_, c, i) => ({ [c.key]: this.convertArgToType(args[i], c.type, msg.guild) }),
      {}
    )
  }

  /**
   * Helper method to check if message begins with a command prefix
   *
   * @param msg - The CommandMessage with the user's message
   */
  private messageStartsWithPrefix(msg: Message): boolean {
    if (msg.channel.type === 'dm') {
      return true
    }

    if (typeof this.options.commandPrefix === 'string') {
      return msg.content.startsWith(this.options.commandPrefix)
    }

    for (const prefix of this.options.commandPrefix) {
      if (msg.content.startsWith(prefix)) {
        return true
      }
    }

    return false
  }

  /**
   * Handles when a user sends a message.
   *
   * @param msg - CommandMessage object
   */
  private async onMessage(msg: Message): Promise<void> {
    if (msg.author.bot) {
      return
    }

    if (!this.messageStartsWithPrefix(msg)) {
      return
    }

    await this.parseMessageAsCommand(msg)
  }

  /**
   * Tries to get a command from the user's message and execute it
   *
   * @param msg - The CommandMessage representing the user's message
   */
  private async parseMessageAsCommand(msg: Message): Promise<void> {
    const prefix = this.getPrefixFromMessage(msg)
    const withoutPrefix = msg.content.slice(prefix.length)
    const split = withoutPrefix.split(' ')
    const commandName = split[0]
    const args = split.slice(1)

    const command = Command.find(this, commandName)

    if (!command || command.options.unknown || (command.options.guildOnly && msg.guild)) {
      this.emit(Event.INVALID_COMMAND, msg)

      if (this.unknownCommand) {
        msg.command = this.unknownCommand
        await this.runCommandWithArgs(msg, [commandName])
      }

      return
    }

    this.emit(Event.COMMAND_RUN, msg, command, prefix)

    msg.command = command

    if (command.options.args) {
      return this.runCommandWithArgs(msg, args)
    }

    return this.runCommand(msg)
  }

  // tslint:disable: no-unsafe-any
  /**
   * Tries to get command from a single file.
   *
   * @param filePath - Absolute path of command file.
   */
  private async resolveCommand(filePath: string): Promise<void> {
    let ResolvableCommand

    try {
      ResolvableCommand = await import(filePath)
    } catch (err) {
      // swallow
    }

    if (ResolvableCommand.default) {
      ResolvableCommand = ResolvableCommand.default
    }

    if (!ResolvableCommand) {
      return
    }

    const instance: Command = new ResolvableCommand(this)

    this.registerCommand(instance)
  }
  // tslint:enable: no-unsafe-any

  /**
   * Wrapper method to execute a command. Checks permission and handles exceptions.
   *
   * @param msg - The message object.
   * @param command - The command object to be ran.
   * @param args - Command args.
   */
  private async runCommand(msg: Message, args?: object): Promise<void> {
    if (!msg.command) {
      return
    }

    if (!msg.command.hasPermission(msg)) {
      await msg.reply(
        `You do not have permission to use the \`${msg.command.options.name}\` command.`
      )

      return
    }

    await msg.command.run(msg, args).catch(async (err: Error) => this.handleCommandError(msg, err))
  }

  /**
   * Helper method to validate args and run command with args.
   *
   * @param msg - The message object.
   * @param command - The command object to be ran.
   * @param args - Command args.
   */
  private async runCommandWithArgs(msg: Message, args: string[]): Promise<void> {
    if (!msg.command) {
      return
    }

    if (!msg.command.options.args) {
      return this.runCommand(msg)
    }

    const required = msg.command.options.args.filter(arg => !arg.optional)

    if (required.length > args.length) {
      await msg.reply(`Insufficient arguments. Expected at least ${required.length}.`) // TODO: Make this better. Maybe a pretty embed as well?

      return
    }

    const formattedArgs = this.getFormattedArgs(msg.command, args)

    const argsValid = this.validateArgs(msg, msg.command, formattedArgs)

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
  private async validateArgs(msg: Message, command: Command, args: string[]): Promise<boolean> {
    for (let i = 0; i < args.length; i++) {
      if (!command.options.args) {
        continue
      }

      const expectedType = [...command.options.args[i].type]

      let foundType = false
      for (const t of expectedType) {
        if (this.validateType(msg, t as keyof ArgumentType, args[i])) {
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

    return true
  }

  /**
   * Validates a value against a single type
   *
   * @param msg - The message object.
   * @param expected - The expected type.
   * @param value - The value from the user.
   */
  private validateType<K extends keyof ArgumentType>(
    msg: Message,
    expected: K,
    value: string
  ): boolean {
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

  /**
   * Tests a command's arguments for duplicate keys and for optional arguments before required ones.
   *
   * @param command The command to test the arguments of.
   */
  private validateUnregisteredCommandArguments(command: Command): void {
    if (command.options.args) {
      const keys: string[] = []
      let optional = false

      for (const arg of command.options.args) {
        if (arg.optional) {
          optional = true
        } else if (optional) {
          throw new TypeError(
            `Required argument ${arg.key} of command ${
              command.options.name
            } is after an optional argument.`
          )
        }

        if (keys.includes(arg.key)) {
          throw new TypeError(
            `Argument key ${arg.key} is used at least twice in command ${command.options.name}`
          )
        }

        keys.push(arg.key)
      }
    }
  }
}

// source: https://gist.github.com/kethinov/6658166#gistcomment-2733303
/**
 * Gets all files in directory, recursively.
 */
async function walk(dir: string): Promise<string[]> {
  const files = await fs.readdir(dir)
  const fileList: string[] = []

  for (const file of files) {
    const filepath = path.join(dir, file)
    const stat = await fs.stat(filepath)

    if (stat.isDirectory()) {
      fileList.push(...(await walk(filepath)).map(f => path.join(path.parse(filepath).base, f)))
    } else {
      fileList.push(file)
    }
  }

  return fileList
}

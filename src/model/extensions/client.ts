import { Client as DiscordJsClient, Guild, Collection } from 'discord.js'
import { promises as fs } from 'fs'
import * as path from 'path'
import { HelpCommand, UnknownCommand } from '../../commands'
import { ArgumentType, Command, ClientOptions, Message, Event } from '..'
import { Maybe, Nothing } from 'purify-ts/Maybe'
import { Logger } from '../../util'
import { DefaultCommandOptions, initDefaultCommandOptions } from '../default-command-options'
import { ArgumentTypeResolver } from '../argument-type'
import { UserService } from '../../services'

/**
 * Extension of the Discord.js Client.
 *
 * Contains extra methods and properties for managing commands.
 *
 * @see https://discord.js.org/#/docs/main/master/class/Client
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

  private readonly userService = new UserService()

  public constructor(options: ClientOptions) {
    super(options)

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
    this.findDuplicateAndFail(command)

    this.validateUnregisteredCommandArguments(command)

    this.commands.set(command.options.name, command)

    if (command.options.unknown) {
      if (this.unknownCommand && !this.unknownCommand.options.default) {
        throw new TypeError(
          `Command ${this.unknownCommand.options.name} is already the unknown command, ${command.options.name} cannot also be it.`
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
      return this.walk(filePath).then(files => {
        files.forEach(async (file: string) => {
          await this.resolveCommand(path.join(filePath, file))
        })
      })
    }

    filePath.forEach(async (p: string) => {
      await this.registerCommandsIn(p)
    })
  }

  /**
   * Registers the built-in commands.
   *
   * @param options Allows you to disable certain default commands.
   */
  public registerDefaultCommands(options: DefaultCommandOptions = {}): void {
    const mergedSettings = { ...initDefaultCommandOptions(), ...options }

    if (mergedSettings.help) {
      this.registerCommand(new HelpCommand(this))
    }

    if (mergedSettings.unknown) {
      this.registerCommand(new UnknownCommand(this))
    }
  }

  /**
   * Helper method to fail when a duplicate command is registered.
   *
   * @param command - The comamnd that was attempted to be registered.
   * @param existingCommand - A command that was previously registered with the same name or alias.
   */
  private failDuplicate(command: Command, existingCommand: Command): never {
    throw new TypeError(
      `Unable to register command '${command.options.name}'. I've already registered a command '${existingCommand.options.name}' which either has the same name or shares an alias.`
    )
  }

  /**
   * This ensures no commands/aliases with the same name are registered.
   *
   * @param command The command to check against all other commands.
   */
  private findDuplicateAndFail(command: Command): void {
    const commandSameName = Command.find(this, command.options.name)

    if (commandSameName) {
      if (commandSameName.options.default) {
        this.commands.delete(commandSameName.options.name)

        return
      }

      this.failDuplicate(command, commandSameName)
    }

    if (!command.options.aliases) {
      return
    }

    for (const alias of command.options.aliases) {
      const commandSameAlias = Command.find(this, alias)

      if (commandSameAlias) {
        if (commandSameAlias.options.default) {
          this.commands.delete(commandSameAlias.options.name)

          return
        }

        this.failDuplicate(command, commandSameAlias)
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
   * Gets the prefix used by the user (in case an array was used)
   *
   * @param msg - The CommandMessage representing the user's message
   */
  private getPrefixFromMessage(msg: Message): string {
    if (msg.channel.type === 'dm') {
      return ''
    }

    if (typeof this.options.commandPrefix === 'string') {
      return this.options.commandPrefix
    }

    let prefix = ''

    for (const prefixOption of this.options.commandPrefix) {
      if (msg.content.startsWith(prefixOption)) {
        prefix = prefixOption
        break
      }
    }

    return prefix
  }

  /**
   * Handles exceptions generated from command execution.
   */
  private async handleCommandError(msg: Message, error: Error): Promise<void> {
    // tslint:disable-next-line: no-non-null-assertion
    const owner = this.users.get(this.options.ownerId)!
    const ownerDisplayString = `${owner.username}#${owner.discriminator}`
    await msg
      .reply(
        // tslint:disable-next-line: no-non-null-assertion
        `An error occurred during the execution of the \`${msg.command!.options.name}\` command: ${
          error.message
        }\n\nYou should never see this. Please contact ${ownerDisplayString}.`
      )
      .catch(_ => {
        // swallow
      })
    Logger.error(error)
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
    const withoutPrefix = msg.content.slice(prefix.length).trim()
    const split = withoutPrefix.split(' ')
    const commandName = split[0]
    const args = split.slice(1)

    const command = Command.find(this, commandName)

    if (
      !command ||
      command.options.unknown ||
      (command.options.guildOnly && msg.guild) ||
      (command.options.ownerOnly && msg.author.id !== this.options.ownerId)
    ) {
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

    return this.runCommand(msg, Nothing)
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

    const instance = new ResolvableCommand(this) as Command

    if (!instance) {
      return
    }

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
  private async runCommand(msg: Message, args: Maybe<object>): Promise<void> {
    if (!msg.command) {
      return
    }

    const hasPermission = await msg.command.hasPermission(msg)

    if (typeof hasPermission === 'string') {
      await msg.reply(hasPermission)

      return
    }

    if (!hasPermission) {
      await msg.reply(
        `You do not have permission to use the \`${msg.command.options.name}\` command.`
      )

      return
    }

    await msg.command
      .run(msg, args.extract())
      .catch(async (err: Error) => this.handleCommandError(msg, err))
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
      return this.runCommand(msg, Nothing)
    }

    const required = msg.command.options.args.filter(
      arg => !arg.optional && arg.default === undefined
    )

    if (required.length > args.length) {
      await msg.reply(`Insufficient arguments. Expected at least ${required.length}.`) // TODO: Make this better. Maybe a pretty embed as well?

      return
    }

    const formattedArgs = this.getFormattedArgs(msg.command, args)

    const argsValid = await this.validateArgs(msg, msg.command, formattedArgs)

    if (!argsValid) {
      return
    }

    const argsObject = this.mapArgsToObject(msg, formattedArgs)

    return this.runCommand(msg, argsObject)
  }

  /**
   * Converts an array of arguments to an object key/value store with the designated type from the command args.
   *
   * @param command - The command object.
   * @param args - The formatted argument string array.
   */
  private mapArgsToObject(msg: Message, args: string[]): Maybe<object> {
    return Maybe.fromNullable(msg.command)
      .chainNullable(command => command.options.args)
      .map(commandArgs =>
        commandArgs.map((argument, index) => ({
          [argument.key]: this.resolveArgumentType(
            args[index] || argument.default || '',
            argument.type,
            msg.guild
          ).extract()
        }))
      )
      .map(keyValueArray =>
        keyValueArray.reduce((occumulator, value) => ({ ...occumulator, ...value }), {})
      )
  }

  private resolveArgumentType(
    value: string,
    argumentType: ArgumentType | ArgumentType[],
    guild: Guild
  ) {
    if (Array.isArray(argumentType)) {
      for (const type of argumentType) {
        const resolved = ArgumentTypeResolver(type)({
          input: value,
          guild,
          userService: this.userService
        })
        if (resolved.isJust()) {
          return resolved
        }
      }

      return Maybe.empty()
    }

    return ArgumentTypeResolver(argumentType)({
      input: value,
      guild,
      userService: this.userService
    })
  }

  /**
   * Validates user arguments against required command arguments.
   *
   * @param msg - The message object.
   * @param command - The command object.
   * @param args - The arguments provided by the user.
   */
  private async validateArgs(msg: Message, command: Command, args: string[]): Promise<boolean> {
    if (!command.options.args) {
      return true
    }

    for (let i = 0; i < command.options.args.length; i++) {
      const commandArg = command.options.args[i]

      if (commandArg.optional && !args[i]) {
        return true
      }

      if (commandArg.default && !args[i]) {
        return true
      }

      const expectedType = [...commandArg.type]

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
    }
    for (let i = 0; i < args.length; i++) {
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

        return this.userService.getMemberFromMention(msg.guild, value).isJust()
      default:
        return true
    }
  }

  /**
   * Tests a command's arguments for duplicate keys and for optional arguments before required ones.
   *
   * @param command The command to test the arguments of.
   */
  private validateUnregisteredCommandArguments(command: NonNullable<Command>): void {
    if (command.options.args) {
      const keys: string[] = []
      let optional = false

      for (const arg of command.options.args) {
        if (arg.optional) {
          optional = true
        } else if (optional) {
          throw new TypeError(
            `Required argument ${arg.key} of command ${command.options.name} is after an optional argument.`
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

  // source: https://gist.github.com/kethinov/6658166#gistcomment-2733303
  /**
   * Gets all files in directory, recursively.
   */
  private async walk(dir: string): Promise<string[]> {
    const files = await fs.readdir(dir)
    const fileList: string[] = []

    for (const file of files) {
      const filepath = path.join(dir, file)
      const stat = await fs.stat(filepath)

      if (stat.isDirectory()) {
        fileList.push(
          ...(await this.walk(filepath)).map(f => path.join(path.parse(filepath).base, f))
        )
      } else {
        fileList.push(file)
      }
    }

    return fileList
  }
}

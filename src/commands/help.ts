import { Command } from '../model/command'
import { Message } from '../model/extensions/message'
import { Client } from '../model/extensions/client'
import { MessageEmbed } from '../model/extensions/embed'
import { Argument } from '../model'

/**
 * The default help command.
 */
export class HelpCommand extends Command {
  public constructor(client: Client) {
    super(client, {
      aliases: ['h', 'commands', 'cmds'],
      description: 'Shows the names and descriptions of all commands, and for certain commands.',
      name: 'help',
      group: 'info',
      default: true,
      args: [
        {
          key: 'commandArg',
          phrase: 'Which command do you want to run?',
          optional: true,
          type: 'string'
        }
      ]
    })
  }

  /**
   * Ran when the user runs `[prefix]`help
   *
   * @param msg The message sent by the user
   * @param args The arguments
   */
  public async run(msg: Message, args: HelpCommandArgument): Promise<void> {
    if (!this.client.user) {
      return
    }

    const embed = new MessageEmbed(this.client).setAuthor(msg.author.username)
    const foundCommand = Command.find(this.client, args.commandArg)

    if (foundCommand) {
      return this.showHelpForCommand(msg, embed, foundCommand)
    }

    return this.showHelp(msg, embed, args.commandArg === 'all')
  }

  /**
   * Tells the user about every command.
   * @param msg The message sent by the user.
   * @param embedArg The embed to send with the message.
   * @param showAll Whether or not we should show all commands.
   */
  private async showHelp(msg: Message, embedArg: MessageEmbed, showAll: boolean): Promise<void> {
    let embed = embedArg.setTitle('Command List').setDescription(this.getDescription(msg))
    let length = (embed.title?.length || 0) + (embed.footer?.text || '').length + (embed.description?.length || 0)

    const commands = this.getCommandsByGroup()

    for (const pair of commands.entries()) {
      const groupName = pair[0]
      const groupCommands = pair[1]
      const fieldUpdateResult = await this.getContentForField(msg, embed, groupName, groupCommands, showAll)

      embed = fieldUpdateResult.embed
      length += groupName.length

      if (embed.fields?.length === 25 || length + fieldUpdateResult.length > 6000) {
        await msg.author.send({ embed })
        embed = new MessageEmbed(this.client).setTitle('Command list')
      }

      embed.addField(groupName, fieldUpdateResult.content)
    }

    await msg.author.send({ embed })
  }

  /**
   * Gets the content in a field for the help command.
   * Will add fields if necessary.
   * @param msg The message sent by the user.
   * @param embedArg The embed to send with the message.
   * @param group The command group being traversed.
   * @param commands The commands in the group.
   * @param showAll Whether or not we should show all commands.
   */
  private async getContentForField(msg: Message, embedArg: MessageEmbed, group: string, commands: Command[], showAll: boolean): Promise<{
    /**
     * The content of the field to be added.
     */
    content: string,
    /**
     * The embed object.
     */
    embed: MessageEmbed,
    /**
     * The total length added to the embed.
     */
    length: number
  }> {
    let embed = embedArg
    let content = ''
    let groupName = group
    let length = 0

    for (const command of commands) {
      if (
        command.options.unknown ||
        command.options.hidden ||
        ((showAll && !command.hasPermission(msg)) || (command.options.guildOnly && msg.guild))
      ) {
        continue
      }

      const name = `${command.options.name}${command.options.guildOnly ? '(Guild only)' : ''}`
      const added = `**${name}** - ${command.options.description}\n`

      if (length + added.length > 6000) {
        await msg.author.send({ embed })
        embed = new MessageEmbed(this.client).setTitle('Command list')
      }

      if (content.length + added.length > 1024) {
        embed.addField(groupName, content)

        groupName = `${groupName} (cont.)`
        length += groupName.length
        content = ''
      }

      content += added
      length += added.length
    }

    return { content, embed, length }
  }

  /**
   * Maps the bot's commands by group.
   */
  private getCommandsByGroup(): Map<string, Command[]> {
    const commands: Map<string, Command[]> = new Map()

    for (const command of this.client.commands.values()) {
      let group = command.options.group

      if (!group) {
        group = 'no group'
      }

      const groupArray = commands.get(group)

      if (groupArray) {
        commands.set(group, groupArray.concat(command))
      } else {
        commands.set(group, [command])
      }
    }

    return commands
  }

  /**
   * Helper method to get the embed description
   *
   * @param msg - The Message from the command
   */
  private getDescription(msg: Message): string {
    const tag = this.client.user ? `@${this.client.user.tag}` : ''
    const guild = msg.guild ? msg.guild.name : ''
    const prefix = this.getPrefix()

    let description = `Use \`${prefix}command\` or \`${tag} command\` to run a command. For example, \`${prefix}help\` or \`${tag} help\`.\n`
    description += `To run a command in DMs with me, use \`command\` with no prefix.\n\n`
    description += `Use \`help all\` to view a list of *all* commands, not just available ones.\n\n`
    description += guild
      ? `__**Available commands in ${guild}**__\n\n`
      : '__**Available commands**__\n\n'

    return description
  }

  /**
   * Tells the user about a single command, rather than all of them.
   * @param msg The message sent by the user.
   * @param embed The embed to send with the message.
   * @param prefix The prefix to use when creating a format for the command.
   * @param command The command to tell the user about.
   */
  private async showHelpForCommand(
    msg: Message,
    embed: MessageEmbed,
    command: Command
  ): Promise<void> {
    const prefix = this.getPrefix()
    const formatArgument = (argument: Argument) =>
      argument.optional ? `[${argument.key}]` : `<${argument.key}>`
    const format = `\`${prefix}${command.options.name} ${
      command.options.args ? command.options.args.map(formatArgument).join(' ') : ''
      }\``

    const aliases = command.options.aliases
      ? command.options.aliases.map(a => `\`${a}\``).join(', ')
      : 'None'

    embed
      .setTitle(`Command: ${command.options.name}`)
      .addField('Description', command.options.description)
      .addField('Format', format)
      .addField('Aliases', aliases)

    if (command.options.group) {
      embed.addField('Group', command.options.group)
    }

    await msg.author.send({ embed })
  }

  /**
   * Helper method to get the command prefix
   */
  private getPrefix(): string {
    return typeof this.client.options.commandPrefix === 'string'
      ? this.client.options.commandPrefix
      : this.client.options.commandPrefix[0]
  }
}

export interface HelpCommandArgument {
  /**
   * The command the user wants help with.
   */
  commandArg: string
}

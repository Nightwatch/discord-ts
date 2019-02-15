import { Command } from '../model/command'
import { CommandoMessage } from '../model/message'
import { CommandoClient } from '../model/client'
import { MessageEmbed } from 'discord.js'
import { CommandoEmbed } from '../model/embed'
import { Argument } from '../model'

/**
 * The default help command.
 */
export class HelpCommand extends Command {
  public constructor(client: CommandoClient) {
    super(client, {
      aliases: ['h', 'commands', 'cmds'],
      description: 'Shows the names and descriptions of all commands, and for certain commands.',
      name: 'help',

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
  public async run(msg: CommandoMessage, args: HelpCommandArgument): Promise<void> {
    if (!this.client.user) {
      return
    }

    let embed = new CommandoEmbed(this.client).setAuthor(msg.author.username)

    const foundCommand = Command.find(this.client, args.commandArg)

    if (foundCommand) {
      return this.showHelpForCommand(msg, embed, foundCommand)
    }

    embed.setTitle('Command List').setDescription(this.getDescription(msg))

    let length = embed.title.length + (embed.footer.text || '').length + embed.description.length

    for (const command of this.client.commands.values()) {
      if (
        command.options.unknown ||
        command.options.hidden ||
        ((args.commandArg !== 'all' && !command.hasPermission(msg)) ||
          (command.options.guildOnly && msg.guild))
      ) {
        continue
      }

      const name = `${command.options.name}${command.options.guildOnly ? '(Guild only)' : ''}`
      const addedLength = name.length + command.options.description.length

      if (embed.fields.length === 25 || length + addedLength > 6000) {
        await msg.author.send({ embed })
        embed = new MessageEmbed().setTitle('Command list')
      }

      embed.addField(name, command.options.description)
      length += addedLength
    }

    await msg.author.send({ embed })
  }

  /**
   * Helper method to get the embed description
   *
   * @param msg - The CommandoMessage from the command
   */
  private getDescription(msg: CommandoMessage): string {
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
   * Helper method to get the command prefix
   */
  private getPrefix(): string {
    return typeof this.client.options.commandPrefix === 'string'
      ? this.client.options.commandPrefix
      : this.client.options.commandPrefix[0]
  }

  /**
   * Tells the user about a single command, rather than all of them.
   * @param msg The message sent by the user.
   * @param embed The embed to send with the message.
   * @param prefix The prefix to use when creating a format for the command.
   * @param command The command to tell the user about.
   */
  private async showHelpForCommand(
    msg: CommandoMessage,
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

    await msg.author.send({ embed })
  }
}

export interface HelpCommandArgument {
  /**
   * The command the user wants help with.
   */
  commandArg: string
}

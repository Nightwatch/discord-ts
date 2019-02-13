import { Command } from '../model/command'
import { CommandoMessage } from '../model/message'
import { CommandoClient } from '../model/client'
import { MessageEmbed } from 'discord.js'

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

    let embed = new MessageEmbed()
      .setAuthor(msg.author.username, msg.author.displayAvatarURL())
      .setColor('GREEN')
      .setFooter(this.client.user.username, this.client.user.displayAvatarURL())
    const prefix =
      typeof this.client.options.commandPrefix === 'string'
        ? this.client.options.commandPrefix
        : this.client.options.commandPrefix[0]
    const cmd = Command.find(this.client, args.commandArg)

    if (cmd) {
      const format = `\`${prefix}${cmd.options.name} ${
        cmd.options.args
          ? cmd.options.args.map(arg => (arg.optional ? `[${arg.key}]` : `<${arg.key}>`)).join(' ')
          : ''
      }\``

      const aliases = cmd.options.aliases
        ? cmd.options.aliases.map(a => `\`${a}\``).join(', ')
        : 'None'

      embed
        .setTitle(`Command: ${cmd.options.name}`)
        .addField('Format', format)
        .addField('Aliases', aliases)

      await msg.author.send({ embed, split: true })

      return
    }

    const tag = this.client.user ? `@${this.client.user.tag}` : ''
    const guild = msg.guild ? msg.guild.name : ''
    let description = `Use \`${prefix}command\`${
      tag ? ` or \`${tag} command\`` : ''
    } to run a command. For example, \`${prefix}help\`${tag ? ` or \`${tag} help\`` : ''}.\n`
    description += `To run a command in DMs with me, use \`command\` with no prefix.\n\n`
    description += `Use \`help all\` to view a list of *all* commands, not just available ones.\n\n`
    description += `__**Available commands${guild ? ` in ${guild}` : ''}**__\n\n`

    embed.setTitle('Command List').setDescription(description)

    // tslint:disable-next-line no-non-null-assertion
    let length = embed.title.length + embed.footer.text!.length + embed.description.length

    for (const command of this.client.commands.values()) {
      if (
        command.options.unknown ||
        command.options.hidden ||
        (args.commandArg !== 'all' && !command.hasPermission(msg))
      ) {
        continue
      }

      const name = `${command.options.name}${command.options.guildOnly ? '(Guild only)' : ''}`
      const addedLength = name.length + command.options.description.length

      if (embed.fields.length === 25 || length + addedLength > 6000) {
        await msg.author.send({ embed, split: true })
        embed = new MessageEmbed().setTitle('Command list')
      }

      embed.addField(name, command.options.description)
      length += addedLength
    }

    await msg.author.send({ embed, split: true })
  }
}

export interface HelpCommandArgument {
  /**
   * The command the user wants help with.
   */
  commandArg: string
}

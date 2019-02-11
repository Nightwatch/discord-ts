import { Command } from '../model/command'
import { CommandoMessage } from '../model/message'
import { CommandoClient } from '../model/client'

/**
 * The default help command.
 */
export class HelpCommand extends Command {
  public constructor(client: CommandoClient) {
    super(client, {
      aliases: ['h', 'commands', 'cmds'],
      description: 'This command.',
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
   * @param args The command the user wants help with.
   */
  // tslint:disable-next-line completed-docs
  public async run(msg: CommandoMessage, args: { commandArg: string }): Promise<void> {
    const prefix =
      typeof this.client.options.commandPrefix === 'string'
        ? this.client.options.commandPrefix
        : this.client.options.commandPrefix[0]
    const cmdArg = Command.find(this.client, args.commandArg)

    if (cmdArg) {
      let help = `__Command **${cmdArg.options.name}**__: ${cmdArg.options.description}${
        cmdArg.options.guildOnly ? ` (Usable only in servers)` : ''
      }\n`
      help += `**Format:** \`${prefix}${cmdArg.options.name} ${
        cmdArg.options.args
          ? cmdArg.options.args
              .map(arg => (arg.optional ? `[${arg.key}]` : `<${arg.key}>`))
              .join(' ')
          : ''
      }\`\n`
      help += `**Aliases:** ${
        cmdArg.options.aliases ? cmdArg.options.aliases.map(a => `\`${a}\``).join(', ') : 'None'
      }`

      await msg.author.send(help, { split: true })

      return
    }

    const tag = this.client.user ? `@${this.client.user.tag}` : ''
    const guild = msg.guild ? msg.guild.name : ''
    let helpMsg = `To run a command in ${guild || 'a server'}, use \`${prefix}command\`${
      tag ? ` or \`${tag} command\`` : ''
    }. For example, \`${prefix}help\`${tag ? ` or \`${tag} help\`` : ''}.\n`
    helpMsg += `To run a command in this DM, simply use \`command\` with no prefix.\n\n`
    helpMsg += `Use \`help all\` to view a list of *all* commands, not just available ones.\n\n`
    helpMsg += `__**Available commands${guild ? ` in ${guild}` : ''}**__\n\n`

    for (const command of this.client.commands) {
      const cmd = command[1]

      if (
        cmd.options.unknown ||
        cmd.options.hidden ||
        (args.commandArg !== 'all' && !cmd.hasPermission(msg))
      ) {
        continue
      }

      helpMsg += `**${cmd.options.name}:** ${cmd.options.description}\n`
    }

    await msg.author.send(helpMsg, { split: true })
  }
}

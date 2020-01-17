import { Argument } from '.'

export interface CommandOptions {
  /**
   * Optional aliases that can be used to execute the command.
   *
   * e.g. `['h']` for a help command with name `help`
   */
  aliases?: string[]

  /**
   * Optional command arguments if the command requires values from the user.
   */
  args?: Argument[]

  /**
   * Specifies that the command is a default command from bot-ts, allowing the command to be overidden.
   */
  default?: boolean

  /**
   * A description of the command so others know what it does.
   */
  description: string

  /**
   * The group the command belongs to.
   *
   * A command group helps to organize your commands by grouping commands of similar functionality.
   *
   * Some examples are `games`, `admin`, `debug`, etc.
   */
  group?: string

  /**
   * Whether or not the command is only usable in guilds.
   */
  guildOnly?: boolean

  /**
   * Whether or not the commad is only usable by the bot owner.
   */
  ownerOnly?: boolean

  /**
   * Whether or not this command is hidden from the default help command.
   */
  hidden?: boolean

  /**
   * The name of the command. What the user must type to run the command. Must be unique.
   */
  name: string

  /**
   * Whether or not the command should be run whenever a user runs an unknown command.
   * Only one command can have this property. It will not show up in the help command.
   */
  unknown?: boolean
}

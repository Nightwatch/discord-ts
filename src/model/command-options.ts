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
   * A description of the command so others know what it does.
   */
  description: string

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

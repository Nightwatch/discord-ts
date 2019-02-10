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
}

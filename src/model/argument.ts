import { ArgumentType } from '.'

/**
 * A command argument.
 *
 * For an `echo` command, you would need one argument, the `phrase` to echo, which would be a string.
 *
 * More complex commands may require several arguments, with varying types.
 */
export interface Argument {
  /**
   * The name of the argument.
   *
   * If you want to write an echo command, you would want the phrase to echo. A good key would be `phrase`.
   */
  key: string

  /**
   * Whether or not the argument is optional. Cannot come before a required argument.
   */
  optional?: boolean

  /**
   * A message that displays when the argument is missing.
   */
  phrase: string

  /**
   * A default value for the argument if it is not passed by the user.
   */
  default?: any

  /**
   * The type of the argument.
   * Can be a single type, or an array of types.
   *
   * `string` accepts any value.
   *
   * `number` requires the value to be numerical.
   *
   * `user` requires the value to be a user mention.
   *
   * You can also allow multiple types.
   *
   * `['user', 'number']` will allow the value to be either a user mention or a numeric value.
   * The order of the types matter.
   */
  type: ArgumentType | ArgumentType[]
}

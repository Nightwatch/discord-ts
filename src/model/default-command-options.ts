/**
 * Options to disable default commands.
 */
export interface DefaultCommandOptions {
  /**
   * Register the default help command.
   */
  help?: boolean
  /**
   * Register the default unknown command.
   */
  unknown?: boolean
}

export const initDefaultCommandOptions = (): DefaultCommandOptions => ({
  help: true,
  unknown: true
})

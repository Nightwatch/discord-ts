import { Argument } from '.'

export interface CommandOptions {
  name: string
  description: string
  aliases?: string[]
  args?: Argument[]
}

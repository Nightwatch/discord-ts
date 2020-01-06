import { Guild, GuildMember } from 'discord.js'
import { UserService } from '../services/user-service'
import { Just } from 'purify-ts/Maybe'

export type ArgumentType = 'user' | 'number' | 'string'

interface ArgumentResolverOptions {
  input: string,
  guild: Guild,
  userService: UserService
}

const UserArgumentResolver = (options: ArgumentResolverOptions) => options.userService.getMemberFromMention(options.guild, options.input)
const NumberArgumentResolver = (options: ArgumentResolverOptions) => Just(Number(options.input))
const StringArgumentResolver = (options: ArgumentResolverOptions) => Just(options.input)

export const ArgumentTypeResolver = (key: ArgumentType) => ({
  user: UserArgumentResolver,
  number: NumberArgumentResolver,
  string: StringArgumentResolver
})[key]


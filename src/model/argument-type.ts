import { Guild, GuildMember, GuildMemberResolvable } from 'discord.js'
import { Just, Maybe } from 'purify-ts/Maybe'
import { UserService } from '../services'

export type ArgumentType = 'user' | 'number' | 'string'

interface ArgumentResolverOptions {
  input: string
  guild: Guild
  userService: UserService
}

type Resolvable<T> = (options: ArgumentResolverOptions) => Maybe<T>

const UserArgumentResolver: Resolvable<GuildMemberResolvable> = (
  options: ArgumentResolverOptions
) => options.userService.getMemberFromMention(options.guild, options.input)
const NumberArgumentResolver: Resolvable<number> = (options: ArgumentResolverOptions) =>
  Just(Number(options.input))
const StringArgumentResolver: Resolvable<string> = (options: ArgumentResolverOptions) =>
  Just(options.input)

export const ArgumentTypeResolver = (key: ArgumentType) =>
  ({
    user: UserArgumentResolver,
    number: NumberArgumentResolver,
    string: StringArgumentResolver
  }[key])

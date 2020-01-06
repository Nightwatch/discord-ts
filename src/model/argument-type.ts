import { Guild, GuildMember } from 'discord.js'
import { UserService } from '../services/user-service'

export type ArgumentType = 'user' | 'number' | 'string'

const UserArgumentResolver = (value: string, guild: Guild, userService: UserService) => userService.getMemberFromMention(guild, value)

export const ArgumentTypeResolver = (key: ArgumentType) => ({
  user: UserArgumentResolver,
  number: Number,
  string: String
})[key]


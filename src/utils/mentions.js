const { MessageMentions: { USERS_PATTERN, CHANNELS_PATTERN, ROLES_PATTERN } } = require('discord.js');

const cleanMemberMentions = (message, members) => {
  return message.replace(USERS_PATTERN, (_, id) => members.get(id).displayName);
};

const cleanChannelMentions = (message, channels) => {
  return message.replace(CHANNELS_PATTERN, (_, id) => channels.get(id).name);
};

const cleanRoleMentions = (message, roles) => {
  return message.replace(ROLES_PATTERN, (_, id) => roles.get(id).name);
};

const cleanEmojis = (message) => {
  let newMessage = message;
  newMessage = newMessage.replace(/<:(.+?):\d+>/g, 'Emote $1');
  newMessage = newMessage.replace(/<a:(.+?):\d+>/g, 'Animated emote $1');
  newMessage = newMessage.replace(/\p{Extended_Pictographic}/gu, (match) => `Emoji ${match}`);
  return newMessage;
};

const cleanMessage = (message, { members, channels, roles }) => {
  let clean = message;

  clean = cleanMemberMentions(clean, members);
  clean = cleanChannelMentions(clean, channels);
  clean = cleanRoleMentions(clean, roles);
  clean = cleanEmojis(clean);

  return clean;
};

module.exports = {
  cleanMessage,
  cleanMemberMentions,
  cleanChannelMentions,
  cleanRoleMentions,
  cleanEmojis
};

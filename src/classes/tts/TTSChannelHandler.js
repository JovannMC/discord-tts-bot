/* eslint-disable max-statements */
const logger = require('@greencoast/logger');
const { cleanMessage } = require('../../utils/mentions');
const { getCantConnectToChannelReason } = require('../../utils/channel');

class TTSChannelHandler {
  constructor(client) {
    this.client = client;
  }

  initialize() {
    this.client.on('messageCreate', this.handleMessage.bind(this));
  }

  async handleMessage(message) {
    const { channel, member } = message;
    
    try {
      if (message.author.bot || !message.guild || message.content?.length < 1) {
        return;
      }

      const channelSettings = await this.client.ttsSettings.get(channel);
      if (!channelSettings || !channelSettings.provider) {
        return;
      }

      return await this.handleSay(message, channelSettings);
    } catch (error) {
      logger.error(`Something happened when handling the TTS channel "${channel.name}" (${channel.id}) with message from "${member.displayName}" (${member.id}).`);
      logger.error(error);
    }
  }

  async handleSay(message, channelSettings) {
    const localizer = this.client.localizer.getLocalizer(message.guild);
    const ttsPlayer = this.client.getTTSPlayer(message.guild);
    const connection = ttsPlayer.voice.getConnection();
  
    const settings = await this.client.ttsSettings.getCurrentForChannel(message.channel);
    const extras = settings[channelSettings.provider];
  
    const { me: { voice: myVoice }, name: guildName, id: guildId, members, channels, roles } = message.guild;
    const { channel: memberChannel } = message.member.voice;
    const myChannel = myVoice?.channel;
  
    const messageIntro = this.client.config.get('ENABLE_WHO_SAID') ? `${message.member.displayName} said ` : '';
    const textToSay = cleanMessage(`${messageIntro}${message.content}`, {
      members: members.cache,
      channels: channels.cache,
      roles: roles.cache
    });

    const { joinOnMessage } = channelSettings;
    if (!joinOnMessage && !myChannel || !memberChannel || myChannel !== memberChannel) {
      return;
    }
  
    if (connection) {
      return ttsPlayer.say(textToSay, message.member, channelSettings.provider, extras);
    }
  
    const cantConnectReason = getCantConnectToChannelReason(memberChannel);
    if (cantConnectReason) {
      return message.reply(localizer.t(cantConnectReason));
    }
  
    await ttsPlayer.voice.connect(memberChannel);
    logger.info(`Joining "${memberChannel.name}" (${memberChannel.id}) in "${guildName}" (${guildId}).`);
    await message.reply(localizer.t('command.say.joined', { channel: memberChannel.toString() }));
    return ttsPlayer.say(textToSay, message.member, channelSettings.provider, extras);
  }
}

module.exports = TTSChannelHandler;

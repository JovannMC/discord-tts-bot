/* eslint-disable max-statements */
const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('@greencoast/logger');
const { getCantConnectToChannelReason } = require('../../utils/channel');
const { cleanMessage } = require('../../utils/mentions');

class SayBaseCommand extends SlashCommand {
  constructor(client, options) {
    super(client, {
      name: options.name,
      description: options.description,
      emoji: options.emoji,
      group: options.group,
      guildOnly: true,
      dataBuilder: new SlashCommandBuilder()
        .addStringOption((input) => {
          return input
            .setName('message')
            .setDescription('The message to say in your voice channel.')
            .setRequired(true);
        })
    });
  }

  getProviderName() {
    throw new Error('getProviderName() not implemented!');
  }

  async run(interaction) {
    await interaction.deferReply();

    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const ttsPlayer = this.client.getTTSPlayer(interaction.guild);
    const connection = ttsPlayer.voice.getConnection();

    const currentSettings = await this.client.ttsSettings.getCurrent(interaction);
    const providerName = this.getProviderName(currentSettings);
    const extras = currentSettings[providerName];

    const { name: guildName, id: guildId, members, channels, roles } = interaction.guild;
    const myVoice = interaction.guild.members.me.voice;
    const { channel: memberChannel } = interaction.member.voice;
    const myChannel = myVoice?.channel;

    const messageIntro = this.client.config.get('ENABLE_WHO_SAID') ? `${interaction.member.displayName} said ` : '';
    const message = cleanMessage(`${messageIntro}${interaction.options.getString('message')}`, {
      members: members.cache,
      channels: channels.cache,
      roles: roles.cache
    });

    if (!memberChannel) {
      await interaction.editReply(localizer.t('command.say.no_channel'));
      return;
    }

    if (connection) {
      if (myChannel !== memberChannel) {
        await interaction.editReply(localizer.t('command.say.different_channel'));
        return;
      }

      await interaction.editReply(localizer.t('command.say.success'));
      return ttsPlayer.say(message, interaction.member, providerName, extras);
    }

    const cantConnectReason = getCantConnectToChannelReason(memberChannel);
    if (cantConnectReason) {
      await interaction.editReply(localizer.t(cantConnectReason));
      return;
    }

    await ttsPlayer.voice.connect(memberChannel);
    logger.info(`Joined "${memberChannel.name}" (${memberChannel.id}) in "${guildName}" (${guildId}).`);
    await interaction.editReply(localizer.t('command.say.joined', { channel: memberChannel.toString() }));
    return ttsPlayer.say(message, interaction.member, providerName, extras);
  }
}

module.exports = SayBaseCommand;

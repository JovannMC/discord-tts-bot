const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('@greencoast/logger');

class DeleteChannelProviderCommand extends SlashCommand {
  constructor(client) {
    super(client, {
      name: 'delete_channel_provider',
      description: 'Disable message-only based TTS on this channel (deletes its saved settings).',
      emoji: ':x:',
      group: 'config',
      guildOnly: true,
      userPermissions: ['MANAGE_CHANNELS'],
      dataBuilder: new SlashCommandBuilder()
    });
  }

  async run(interaction) {
    const { guild, channel } = interaction;
    const { name: guildName, id: guildId } = guild;
    const { name: channelName, id: channelId } = channel;
    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const channelSettings = await this.client.ttsSettings.get(interaction.channel);

    if (!channelSettings || !channelSettings.provider) {
      return interaction.reply({ content: localizer.t('channel_commands.delete.already_disabled') });
    }

    await this.client.ttsSettings.delete(interaction.channel);
    logger.info(`"${guildName}" (${guildId}) has disabled message-only TTS for the channel "${channelName}" (${channelId})`);
    return interaction.reply({ content: localizer.t('channel_commands.delete.success') });
  }
}

module.exports = DeleteChannelProviderCommand;

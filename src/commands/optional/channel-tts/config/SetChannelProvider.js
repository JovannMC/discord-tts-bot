const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('@greencoast/logger');
const ProviderManager = require('../../../../classes/tts/providers/ProviderManager');

class SetChannelProvider extends SlashCommand {
  constructor(client) {
    super(client, {
      name: 'set_channel_provider',
      description: 'Sets the provider to be used by the message-only based TTS on specific channels.',
      emoji: ':pencil2:',
      group: 'config',
      guildOnly: true,
      userPermissions: ['MANAGE_CHANNELS'],
      dataBuilder: new SlashCommandBuilder()
        .addStringOption((input) => {
          return input
            .setName('provider')
            .setDescription('The provider to use from now on.')
            .setRequired(true)
            .addChoices(ProviderManager.SUPPORTED_PROVIDERS.map((p) => [p.FRIENDLY_NAME, p.NAME]));
        })
    });
  }

  async run(interaction) {
    const { guild, channel } = interaction;
    const { name: guildName, id: guildId } = guild;
    const { name: channelName, id: channelId } = channel;
    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const providerName = interaction.options.getString('provider');
    const providerFriendlyName = ProviderManager.PROVIDER_FRIENDLY_NAMES[providerName];

    await this.client.ttsSettings.set(interaction.channel, { provider: providerName });

    logger.info(`"${guildName}" (${guildId}) has changed the provider for the channel "${channelName}" (${channelId}) to "${providerName}".`);
    return interaction.reply({ content: localizer.t('channel_commands.set.success', { name: providerFriendlyName }) });
  }
}

module.exports = SetChannelProvider;

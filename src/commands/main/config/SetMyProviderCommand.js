const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('@greencoast/logger');
const ProviderManager = require('../../../classes/tts/providers/ProviderManager');

class SetMyProviderCommand extends SlashCommand {
  constructor(client) {
    super(client, {
      name: 'set_my_provider',
      description: 'Sets the provider to be used by the say command for yourself.',
      emoji: ':pencil2:',
      group: 'config',
      guildOnly: true,
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
    const { name: guildName, id: guildId } = interaction.guild;
    const { displayName: memberName, id: memberId } = interaction.member;
    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const providerName = interaction.options.getString('provider');
    const providerFriendlyName = ProviderManager.PROVIDER_FRIENDLY_NAMES[providerName];

    await this.client.ttsSettings.set(interaction.member, { provider: providerName });

    logger.info(`User "${memberName}" (${memberId}) in "${guildName}" (${guildId}) has changed their provider to "${providerName}".`);
    return interaction.reply({ content: localizer.t('command.set.my.provider.success', { name: providerFriendlyName }) });
  }
}

module.exports = SetMyProviderCommand;

const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('@greencoast/logger');
const GoogleProvider = require('../../../../classes/tts/providers/GoogleProvider');
const languages = require('../../../../../provider-data/google_languages.json');

class GoogleSetChannelSettingsCommand extends SlashCommand {
  constructor(client) {
    super(client, {
      name: 'google_set_channel',
      description: 'Sets the settings to be used with message-only based TTS from Google.',
      emoji: ':pencil2:',
      group: 'google-tts',
      guildOnly: true,
      userPermissions: ['MANAGE_CHANNELS'],
      dataBuilder: new SlashCommandBuilder()
        .addSubcommand((input) => {
          return input
            .setName('language')
            .setDescription('Sets the language to be used by the message-only based TTS.')
            .addStringOption((input) => {
              return input
                .setName('value')
                .setDescription('The language to use from now. Use /google_langs to see a list of supported languages.')
                .setRequired(true);
            });
        })
        .addSubcommand((input) => {
          return input
            .setName('speed')
            .setDescription('Sets the speed to be used by the message-only based TTS.')
            .addStringOption((input) => {
              return input
                .setName('value')
                .setDescription('The speed to use from now.')
                .setRequired(true)
                .setChoices(GoogleProvider.getSupportedSpeedChoices());
            });
        })
    });
  }

  async handleLanguage(interaction, localizer) {
    const { guild, channel } = interaction;
    const { name: guildName, id: guildId } = guild;
    const { name: channelName, id: channelId } = channel;
    const language = interaction.options.getString('value');
    const languageInfo = languages[language];

    if (!languageInfo) {
      return interaction.reply({ content: localizer.t('channel_commands.google.settings.language.invalid') });
    }

    await this.client.ttsSettings.set(interaction.channel, { [GoogleProvider.NAME]: { language } });

    logger.info(`"${guildName}" (${guildId}) has changed the Google language for the channel "${channelName}" (${channelId}) to "${language}".`);
    return interaction.reply({ content: localizer.t('channel_commands.google.settings.language.success', { language: languageInfo.name }) });
  }

  async handleSpeed(interaction, localizer) {
    const { guild, channel } = interaction;
    const { name: guildName, id: guildId } = guild;
    const { name: channelName, id: channelId } = channel;
    const speed = interaction.options.getString('value');

    await this.client.ttsSettings.set(interaction.channel, { [GoogleProvider.NAME]: { speed } });

    logger.info(`"${guildName}" (${guildId}) has changed the Google speed for the channel "${channelName}" (${channelId}) to "${speed}".`);
    return interaction.reply({ content: localizer.t('channel_commands.google.settings.speed.success', { speed }) });
  }

  async run(interaction) {
    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case 'language':
        return this.handleLanguage(interaction, localizer);
      case 'speed':
        return this.handleSpeed(interaction, localizer);
      default:
        throw new Error(`Invalid subcommand "${subCommand}" supplied to GoogleSetChannelSettingsCommand.`);
    }
  }
}

module.exports = GoogleSetChannelSettingsCommand;

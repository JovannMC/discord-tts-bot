const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('@greencoast/logger');
const MicrosoftProvider = require('../../../classes/tts/providers/MicrosoftProvider');
const languageData = require('../../../../provider-data/ttstool_microsoft_languages.json');

class MicrosoftSetDefaultSettingsCommand extends SlashCommand {
  constructor(client) {
    super(client, {
      name: 'ms_set_default',
      description: 'Sets the settings to be used by the say and ms_say commands by default.',
      emoji: ':pencil2:',
      group: 'ms-tts',
      guildOnly: true,
      userPermissions: ['MANAGE_GUILD'],
      dataBuilder: new SlashCommandBuilder()
        .addSubcommand((input) => {
          return input
            .setName('language')
            .setDescription('Sets the language to be used by the say and ms_say commands by default.')
            .addStringOption((input) => {
              return input
                .setName('value')
                .setDescription('The language to use from now. Use /ms_langs to see a list of supported languages.')
                .setRequired(true);
            });
        })
        .addSubcommand((input) => {
          return input
            .setName('voice')
            .setDescription('Sets the voice to be used by the say and ms_say commands by default.')
            .addStringOption((input) => {
              return input
                .setName('value')
                .setDescription('The voice to be used from now. Use /ms_voices to see a list of supported voices.')
                .setRequired(true);
            });
        })
        .addSubcommand((input) => {
          return input
            .setName('volume')
            .setDescription('Sets the volume to be used used by the say and ms_say commands by default.')
            .addStringOption((input) => {
              return input
                .setName('value')
                .setDescription('The volume to be used from now.')
                .setRequired(true)
                .setChoices(MicrosoftProvider.getSupportedVolumeChoices());
            });
        })
        .addSubcommand((input) => {
          return input
            .setName('rate')
            .setDescription('Sets the rate to be used by the say and ms_say commands by default.')
            .addStringOption((input) => {
              return input
                .setName('value')
                .setDescription('The rate to be used from now.')
                .setRequired(true)
                .setChoices(MicrosoftProvider.getSupportedRateChoices());
            });
        })
        .addSubcommand((input) => {
          return input
            .setName('pitch')
            .setDescription('Sets the pitch to be used by the say and ms_say commands by default.')
            .addStringOption((input) => {
              return input
                .setName('value')
                .setDescription('The pitch to be used from now.')
                .setRequired(true)
                .setChoices(MicrosoftProvider.getSupportedPitchChoices());
            });
        })
    });
  }

  async handleLanguage(interaction, localizer) {
    const { name: guildName, id: guildId } = interaction.guild;
    const language = interaction.options.getString('value');
    const languageInfo = languageData[language];

    if (!languageInfo) {
      return interaction.reply({ content: localizer.t('command.microsoft.settings.default.language.unsupported', { language }) });
    }

    const [defaultVoice] = languageInfo.voices;

    await this.client.ttsSettings.set(interaction.guild, {
      [MicrosoftProvider.NAME]: {
        language,
        voice: defaultVoice.id
      }
    });

    logger.info(`"${guildName}" (${guildId}) has changed its default Microsoft language to "${language}" with voice "${defaultVoice.name}".`);
    return interaction.reply({ content: localizer.t('command.microsoft.settings.default.language.success', { language, voice: defaultVoice.name }) });
  }

  async handleVoice(interaction, localizer) {
    const { name: guildName, id: guildId } = interaction.guild;
    const voice = interaction.options.getString('value').toLowerCase();

    const settings = await this.client.ttsSettings.getCurrentForGuild(interaction.guild);
    const { language } = settings[MicrosoftProvider.NAME];
    const languageInfo = languageData[language];

    if (!languageInfo) {
      return interaction.reply({ content: localizer.t('command.microsoft.settings.default.voice.invalidated') });
    }

    const voiceInfo = languageInfo.voices.find((v) => v.name.toLowerCase() === voice);

    if (!voiceInfo) {
      return interaction.reply({ content: localizer.t('command.microsoft.settings.default.voice.unsupported', { voice }) });
    }

    await this.client.ttsSettings.set(interaction.guild, {
      [MicrosoftProvider.NAME]: {
        language,
        voice: voiceInfo.id
      }
    });

    logger.info(`"${guildName}" (${guildId}) has changed its default Microsoft voice to "${voiceInfo.name}".`);
    return interaction.reply({ content: localizer.t('command.microsoft.settings.default.voice.success', { voice: voiceInfo.name }) });
  }

  async handleVolume(interaction, localizer) {
    const { name: guildName, id: guildId } = interaction.guild;
    const volume = interaction.options.getString('value');

    await this.client.ttsSettings.set(interaction.guild, { [MicrosoftProvider.NAME]: { volume } });

    logger.info(`"${guildName}" (${guildId}) has changed its default Microsoft volume to "${volume}".`);
    return interaction.reply({ content: localizer.t('command.microsoft.settings.default.volume.success', { volume }) });
  }

  async handleRate(interaction, localizer) {
    const { name: guildName, id: guildId } = interaction.guild;
    const rate = interaction.options.getString('value');

    await this.client.ttsSettings.set(interaction.guild, { [MicrosoftProvider.NAME]: { rate } });

    logger.info(`"${guildName}" (${guildId}) has changed its default Microsoft rate to "${rate}".`);
    return interaction.reply({ content: localizer.t('command.microsoft.settings.default.rate.success', { rate }) });
  }

  async handlePitch(interaction, localizer) {
    const { name: guildName, id: guildId } = interaction.guild;
    const pitch = interaction.options.getString('value');

    await this.client.ttsSettings.set(interaction.guild, { [MicrosoftProvider.NAME]: { pitch } });

    logger.info(`"${guildName}" (${guildId}) has changed its default Microsoft pitch to "${pitch}".`);
    return interaction.reply({ content: localizer.t('command.microsoft.settings.default.pitch.success', { pitch }) });
  }

  async run(interaction) {
    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case 'language':
        return this.handleLanguage(interaction, localizer);
      case 'voice':
        return this.handleVoice(interaction, localizer);
      case 'volume':
        return this.handleVolume(interaction, localizer);
      case 'rate':
        return this.handleRate(interaction, localizer);
      case 'pitch':
        return this.handlePitch(interaction, localizer);
      default:
        throw new Error(`Invalid subcommand "${subCommand}" supplied to MicrosoftSetDefaultSettingsCommand.`);
    }
  }
}

module.exports = MicrosoftSetDefaultSettingsCommand;

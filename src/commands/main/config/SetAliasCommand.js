const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('@greencoast/logger');

class SetAliasCommand extends SlashCommand {
  constructor(client) {
    super(client, {
      name: 'set_alias',
      description: 'Set an alternative way for the TTS to say a specific word or phrase.',
      emoji: ':heavy_equals_sign:',
      group: 'config',
      guildOnly: true,
      userPermissions: ['MANAGE_GUILD'],
      dataBuilder: new SlashCommandBuilder()
        .addStringOption((input) => {
          return input
            .setName('key')
            .setDescription('The word or phrase you want to set an alias for.')
            .setRequired(true);
        })
        .addStringOption((input) => {
          return input
            .setName('value')
            .setDescription('The alternative way you want the TTS to say the word or phrase.')
            .setRequired(true);
        })
    });
  }

  async run(interaction) {
    const { name: guildName, id: guildId } = interaction.guild;
    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const keyName = interaction.options.getString('key');
    const valueName = interaction.options.getString('value');

    await this.client.ttsSettings.set(interaction.guild, {
      aliases: {
        [keyName]: valueName
      }
    });
    logger.info(`Aliases for guild "${guildName}" (${guildId}): ${this.client.ttsSettings.get(interaction.guild).aliases}`);
    logger.info(`"${guildName}" (${guildId}) has aliased "${keyName}" to "${valueName}".`);
    return interaction.reply({ content: localizer.t('command.set.alias.success', { key: keyName, value: valueName }) });
  }
}

module.exports = SetAliasCommand;

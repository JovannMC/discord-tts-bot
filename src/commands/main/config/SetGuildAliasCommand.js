/* eslint-disable max-statements */

const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('@greencoast/logger');

class SetGuildAliasCommand extends SlashCommand {
  constructor(client) {
    super(client, {
      name: 'set_guild_alias',
      description: 'Set an alternative way for the TTS to say a word/phrase for the guild.',
      emoji: ':heavy_equals_sign:',
      group: 'config',
      guildOnly: true,
      userPermissions: ['MANAGE_GUILD'],
      dataBuilder: new SlashCommandBuilder()
        .addStringOption((input) => {
          return input
            .setName('key')
            .setDescription('The word or phrase you want to set (or remove) an alias for.')
            .setRequired(true);
        })
        .addStringOption((input) => {
          return input
            .setName('value')
            .setDescription('The alternative way you want the TTS to say the word or phrase.')
            .setRequired(false);
        })
    });
  }

  async run(interaction) {
    const { name: guildName, id: guildId } = interaction.guild;
    const { displayName: memberName, id: userId } = interaction.member;
    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const keyName = interaction.options.getString('key');
    const valueName = interaction.options.getString('value');

    const ttsSettings = await this.client.ttsSettings.get(interaction.guild);
    const aliases = ttsSettings.aliases || {};

    if (!aliases[keyName] && !valueName) {
      logger.info(`Guild alias for "${keyName}" does not exist in guild "${guildName}" (${guildId}). Ran by "${memberName}" (${userId}).`);
      return interaction.reply({ content: localizer.t('command.set.alias.guild.notFound', { key: keyName }) });
    }

    if (!valueName) {
      logger.info(`Removed guild alias for "${keyName}" (was ${aliases[keyName]}) in guild "${guildName}" (${guildId}). Ran by "${memberName}" (${userId}).`);
      delete aliases[keyName];
      await this.client.ttsSettings.set(interaction.guild, { aliases });
      return interaction.reply({ content: localizer.t('command.set.alias.guild.removed', { key: keyName }) });
    }

    aliases[keyName] = valueName;
    await this.client.ttsSettings.set(interaction.guild, { aliases });
    logger.info(`"${guildName}" (${guildId}) has aliased "${keyName}" to "${valueName}". Ran by "${memberName}" (${userId}).`);
    logger.info(`Aliases for guild "${guildName}" (${guildId}): ${JSON.stringify(aliases)}`);
    return interaction.reply({ content: localizer.t('command.set.alias.guild.success', { key: keyName, value: valueName }) });
  }
}

module.exports = SetGuildAliasCommand;

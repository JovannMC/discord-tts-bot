/* eslint-disable max-statements */

const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('@greencoast/logger');

class SetUserAliasCommand extends SlashCommand {
  constructor(client) {
    super(client, {
      name: 'set_alias',
      description: 'Set an alternative way for the TTS to say a word/phrase for the user.',
      emoji: ':heavy_equals_sign:',
      group: 'config',
      guildOnly: true,
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

    const ttsSettings = await this.client.ttsSettings.get(interaction.member);
    const aliases = ttsSettings.aliases || {};

    if (!aliases[keyName] && !valueName) {
      logger.info(`User "${memberName}" (${userId}) alias for "${keyName}" does not exist in guild "${guildName}" (${guildId}).`);
      return interaction.reply({ content: localizer.t('command.set.alias.user.notFound', { key: keyName }) });
    }

    if (!valueName) {
      logger.info(`Removed user "${memberName}" (${userId}) alias for "${keyName}" (was ${aliases[keyName]}) in guild "${guildName}" (${guildId}).`);
      delete aliases[keyName];
      await this.client.ttsSettings.set(interaction.member, { aliases });
      return interaction.reply({ content: localizer.t('command.set.alias.user.removed', { key: keyName }) });
    }

    aliases[keyName] = valueName;
    await this.client.ttsSettings.set(interaction.member, { aliases });
    logger.info(`""${memberName}" (${userId}) has user aliased "${keyName}" to "${valueName}" in ${guildName}" (${guildId}) .`);
    logger.info(`Aliases for user "${memberName}" (${userId}) in "${guildName}" (${guildId}): ${JSON.stringify(aliases)}`);
    return interaction.reply({ content: localizer.t('command.set.alias.user.success', { key: keyName, value: valueName }) });
  }
}

module.exports = SetUserAliasCommand;

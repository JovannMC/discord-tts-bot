const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { MESSAGE_EMBED, WEBSITE_URL } = require('../../../common/constants');
const { splitContentForEmbedFields } = require('../../../utils/embed');

class HelpCommand extends SlashCommand {
  constructor(client) {
    super(client, {
      name: 'help',
      description: 'Display a help message with all the available commands.',
      emoji: ':question:',
      group: 'misc',
      guildOnly: true,
      dataBuilder: new SlashCommandBuilder()
    });
  }

  prepareFields() {
    return this.client.registry.groups.map((group) => {
      const listOfCommands = group.commands.reduce((text, command) => {
        return text.concat(`${command.emoji} **/${command.name}** - ${command.description}\n`);
      }, '');

      // Ensure listOfCommands is an array
      const splitContent = splitContentForEmbedFields(listOfCommands);

      return { title: group.name, text: splitContent };
    });
  }

  run(interaction) {
    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const fields = this.prepareFields();
    const embed = new MessageEmbed()
      .setTitle(localizer.t('command.help.embed.title'))
      .setColor(MESSAGE_EMBED.color)
      .setThumbnail(MESSAGE_EMBED.helpThumbnail);

    fields.forEach((field) => {
      field.text.forEach((content, index) => {
        embed.addField(`${field.title} (Page ${index + 1})`, content);
      });
    });

    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setStyle('LINK')
          .setEmoji('🐛')
          .setLabel(localizer.t('command.help.links.bug'))
          .setURL(MESSAGE_EMBED.helpURL),
        new MessageButton()
          .setStyle('LINK')
          .setEmoji('🌎')
          .setLabel(localizer.t('command.help.links.website'))
          .setURL(WEBSITE_URL)
      );

    return interaction.reply({ embeds: [embed], components: [row] });
  }
}

module.exports = HelpCommand;

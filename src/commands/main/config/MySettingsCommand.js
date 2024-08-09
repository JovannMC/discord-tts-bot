const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { MESSAGE_EMBED } = require('../../../common/constants');
const ProviderManager = require('../../../classes/tts/providers/ProviderManager');

class MySettingsCommand extends SlashCommand {
  constructor(client) {
    super(client, {
      name: 'my_settings',
      description: 'Get the TTS settings you currently have set for yourself.',
      emoji: ':wrench:',
      group: 'config',
      guildOnly: true,
      dataBuilder: new SlashCommandBuilder()
    });
  }

  prepareFields(settings, localizer) {
    const fields = Object.keys(ProviderManager.PROVIDER_FRIENDLY_NAMES).map((name) => {
      const friendlyName = ProviderManager.PROVIDER_FRIENDLY_NAMES[name];
      const values = settings[name];
      const valueKeys = Object.keys(values);
  
      if (valueKeys.length < 1) {
        return { title: friendlyName, text: localizer.t('command.settings.my.no_settings') };
      }
  
      const text = valueKeys.reduce((text, key) => {
        const setting = values[key];
        return text.concat(`• **${key}**: ${setting}\n`);
      }, '');
  
      return { title: friendlyName, text };
    });
  
    if (settings.aliases && Object.keys(settings.aliases).length > 0) {
      const aliasKeys = Object.keys(settings.aliases);
      const aliasText = aliasKeys.reduce((text, key) => {
        const alias = settings.aliases[key];
        return text.concat(`• **${key}**: ${alias}\n`);
      }, '');
  
      fields.push({ title: localizer.t('command.settings.my.aliases.title'), text: aliasText });
    } else {
      fields.push({ title: localizer.t('command.settings.my.aliases.title'), text: localizer.t('command.settings.my.no_settings') });
    }
  
    return fields;
  }
  
  async run(interaction) {
    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const { provider, ...restSettings } = await this.client.ttsSettings.getCurrent(interaction);

    const fields = this.prepareFields(restSettings, localizer);
    const embed = new MessageEmbed()
      .setTitle(localizer.t('command.settings.my.embed.title', { name: interaction.member.displayName }))
      .setColor(MESSAGE_EMBED.color)
      .setDescription(localizer.t('command.settings.my.embed.description'))
      .addField(localizer.t('command.settings.my.current.provider'), ProviderManager.PROVIDER_FRIENDLY_NAMES[provider]);

    for (const key in fields) {
      const field = fields[key];
      embed.addField(field.title, field.text, true);
    }

    return interaction.reply({ embeds: [embed] });
  }
}

module.exports = MySettingsCommand;

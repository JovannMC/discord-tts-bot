const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('@greencoast/logger');

class SetJoinOnMessage extends SlashCommand {
  constructor(client) {
    super(client, {
      name: 'set_join_on_message',
      description: 'Sets if the bot joins the VC automatically when a message is sent on specific channels.',
      emoji: ':pencil2:',
      group: 'config',
      guildOnly: true,
      userPermissions: ['MANAGE_CHANNELS'],
      dataBuilder: new SlashCommandBuilder()
        .addStringOption((option) =>
          option.setName('state')
            .setDescription('Enable or disable the join on message option.')
            .setRequired(false)
            .addChoice('true', 'true')
            .addChoice('false', 'false')
        )
    });
  }

  async run(interaction) {
    const { guild, channel } = interaction;
    const { name: channelName, id: channelId } = channel;
    const { name: guildName, id: guildId } = guild;
    const localizer = this.client.localizer.getLocalizer(guild);
    const state = interaction.options.getString('state');
    const currentSettings = await this.client.ttsSettings.getCurrentForChannel(channel);
    let newState;

    if (state) {
      newState = state === 'true';
    } else {
      newState = !currentSettings.joinOnMessage;
    }

    await this.client.ttsSettings.set(channel, { joinOnMessage: newState });

    logger.info(`"${guildName}" (${guildId}) has ${newState ? 'enabled' : 'disabled'} the "join on message" option for "${channelName}" (${channelId}).`);
    return interaction.reply({ content: localizer.t(`channel_commands.join.${newState ? 'enabled' : 'disabled'}`) });
  }
}

module.exports = SetJoinOnMessage;

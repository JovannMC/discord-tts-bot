/* eslint-disable max-params */
/* eslint-disable max-statements */

const logger = require('@greencoast/logger');
const { createAudioResource } = require('@discordjs/voice');
const Queue = require('../Queue');
const VoiceManager = require('../VoiceManager');

class TTSPlayer {
  constructor(client, guild, disconnectScheduler) {
    this.client = client;
    this.guild = guild;
    this.disconnectScheduler = disconnectScheduler;
    this.providerManager = client.providerManager;

    this.queue = new Queue();
    this.speaking = false;
    this.voice = new VoiceManager(guild);

    this.initializePlayer();
    this.initializeScheduler();
  }

  initializePlayer() {
    this.voice.player.on('error', (error) => {
      logger.error(error);
      this.speaking = false;
      this.play();
    });

    this.voice.player.on('idle', () => {
      if (this.speaking) {
        this.speaking = false;
        this.play();
      }
    });
  }

  initializeScheduler() {
    this.disconnectScheduler.set(() => {
      const channel = this.stop();
      logger.warn(`Left "${channel.name}" (${channel.id}) from "${this.guild.name}" (${this.guild.id}) due to inactivity.`);
    });
  }

  async say(sentence, member, providerName, extras = {}) {
    const userSettings = await this.client.ttsSettings.get(member);
    const guildSettings = await this.client.ttsSettings.get(this.guild);
    const userAliases = userSettings.aliases || {};
    const guildAliases = guildSettings.aliases || {};

    const finalSentence = await formatMessage(sentence, userAliases, guildAliases, extras);
    logger.info(`Final sentence passed to TTS provider: "${finalSentence}".`);
  
    const provider = this.providerManager.getProvider(providerName);
    const payload = await provider.createPayload(finalSentence, extras);
    if (Array.isArray(payload)) {
      payload.forEach((p) => {
        p.sentence = finalSentence;
        this.queue.enqueue(p);
      });
    } else {
      payload.sentence = finalSentence;
      this.queue.enqueue(payload);
    }
  
    this.startDisconnectScheduler();
  
    if (!this.speaking) {
      this.play();
    }
  }

  play() {
    if (this.queue.isEmpty()) {
      return;
    }

    const payload = this.queue.dequeue();
    const provider = this.providerManager.getProvider(payload.providerName);

    logger.info(provider.getPlayLogMessage(payload, this.guild));

    this.speaking = true;
    this.voice.play(createAudioResource(payload.resource, {
      metadata: {
        title: payload.sentence
      }
    }));
  }

  skip() {
    if (this.queue.isEmpty() && !this.speaking) {
      return false;
    }
  
    const currentPayload = this.queue.store[0];
  
    // Check every payload in queue, and if the payload.sentence matches the currentPayload.sentence, skip it as well
    this.queue.store = this.queue.store.filter((payload) => payload.sentence !== currentPayload.sentence);
  
    this.stopDisconnectScheduler();
    this.speaking = false;
    this.voice.player.stop(true);
  
    if (!this.queue.isEmpty()) {
      this.play();
    }
  
    return true;
  }

  stop() {
    const { channel } = this.guild.members.me.voice;

    this.stopDisconnectScheduler();

    this.queue.clear();
    this.speaking = false;
    this.voice.disconnect();
    this.voice.player.stop(true);

    return channel || { name: 'null', id: 'null' };
  }

  startDisconnectScheduler() {
    if (!this.disconnectScheduler) {
      return;
    }

    if (this.disconnectScheduler.isAlive()) {
      this.disconnectScheduler.refresh();
    } else {
      this.disconnectScheduler.start(this);
    }
  }

  stopDisconnectScheduler() {
    if (!this.disconnectScheduler) {
      return;
    }

    if (this.disconnectScheduler.isAlive()) {
      this.disconnectScheduler.stop();
    }
  }
}

async function formatMessage(message, userAliases, guildAliases, extras) {
  const originalSentence = message;
  let finalSentence = message;

  // User aliases
  for (const [key, value] of Object.entries(userAliases)) {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    if (!regex.test(finalSentence)) {
      continue;
    }
    
    finalSentence = finalSentence.replace(regex, value);
    logger.info(`Replaced "${key}" with "${value}" in the sentence "${originalSentence}". Found in user aliases.`);
  }
  
  // Guild aliases
  for (const [key, value] of Object.entries(guildAliases)) {
    const regex = new RegExp(`\b${key}\\b`, 'gi');
    if (!regex.test(finalSentence)) {
      continue;
    }
    
    finalSentence = finalSentence.replace(regex, value);
    logger.info(`Replaced "${key}" with "${value}" in the sentence "${originalSentence}". Found in guild aliases.`);
  }

  // If the sentence contains a link
  if (/(https?:\/\/[^\s]+)/g.test(finalSentence)) {
    if (/^(https?:\/\/[^\s]+)$/.test(finalSentence)) {
      finalSentence = finalSentence.replace(/(https?:\/\/[^\s]+)/g, 'A link');
    } else {
      finalSentence = finalSentence.replace(/(https?:\/\/[^\s]+)/g, '. A link.');
    }
    logger.info(`Replaced link in the sentence "${originalSentence}".`);
  }
  
  // If the sentence contains a multiline or single line codeblock
  if (/(```[\s\S]+?```|`[^`]+`)/g.test(finalSentence)) {
    if (/^(```[\s\S]+?```|`[^`]+`)$/.test(finalSentence)) {
      finalSentence = finalSentence.replace(/(```[\s\S]+?```|`[^`]+`)/g, 'codeblock.');
    } else {
      finalSentence = finalSentence.replace(/(```[\s\S]+?```|`[^`]+`)/g, '. codeblock.');
    }
    logger.info(`Replaced codeblock in the sentence "${originalSentence}".`);
  }

  // If the sentence has 3 or more punctuation marks in a row
  if (/([^\w\s])\1{2,}/g.test(finalSentence)) {
    finalSentence = finalSentence.replace(/([^\w\s])\1{2,}/g, '$1');
    logger.info(`Replaced 3 or more repeating punctuation marks in the sentence "${originalSentence}".`);
  }
  
  // If the sentence has 3 or more repeating characters in a row
  if (/(\w)\1{2,}/g.test(finalSentence)) {
    finalSentence = finalSentence.replace(/(\w)\1{2,}/g, 'Line of $1\'s, ');
    logger.info(`Replaced 3 or more repeating characters in the sentence "${originalSentence}".`);
  }

  // If message contains images and/or files
  if (extras?.hasImage || extras?.hasFile) {
    const attachmentMessage = `${[
      extras.hasImage ? 'Images' : '',
      extras.hasFile ? 'Files' : ''
    ].filter(Boolean).join(' and ')} attached`;
  
    finalSentence = finalSentence ? `${finalSentence}. ${attachmentMessage}.` : attachmentMessage;
    logger.info(`${attachmentMessage} with message "${originalSentence}".`);
  }

  return finalSentence;
}

module.exports = TTSPlayer;

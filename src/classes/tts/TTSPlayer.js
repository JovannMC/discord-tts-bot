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
    let finalSentence = sentence;
  
    for (const [key, value] of Object.entries(userAliases)) {
      if (!sentence.includes(key)) {
        continue;
      }
      
      finalSentence = finalSentence.replace(new RegExp(key, 'g'), value);
      logger.info(`Replaced "${key}" with "${value}" in the sentence "${sentence}". Found in user aliases.`);
      logger.info(`Final sentence: "${finalSentence}".`);
    }
  
    for (const [key, value] of Object.entries(guildAliases)) {
      if (!sentence.includes(key)) {
        continue;
      }
      
      finalSentence = finalSentence.replace(new RegExp(key, 'g'), value);
      logger.info(`Replaced "${key}" with "${value}" in the sentence "${sentence}". Found in guild aliases.`);
      logger.info(`Final sentence: "${finalSentence}".`);
    }
  
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

  async play() {
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

    this.stopDisconnectScheduler();
    this.speaking = false;
    this.voice.player.stop(true);
    
    this.play();
    return true;
  }

  stop() {
    const { channel } = this.guild.me.voice;

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

module.exports = TTSPlayer;

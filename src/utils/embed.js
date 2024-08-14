const { EMBED_FIELD_MAX_SIZE } = require('../common/constants');

function splitContentForEmbedFields(content) {
  const result = [];
  let currentChunk = '';

  content.split('\n').forEach((line) => {
    if ((currentChunk + line).length > EMBED_FIELD_MAX_SIZE) {
      result.push(currentChunk);
      currentChunk = '';
    }
    currentChunk += `${line}\n`;
  });

  if (currentChunk) {
    result.push(currentChunk);
  }

  return result;
}

module.exports = { splitContentForEmbedFields };

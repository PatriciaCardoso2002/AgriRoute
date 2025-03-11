const { v4: uuidv4 } = require('uuid');

// Generate api-key, like unique identifier: uuid
export function generateApiKey(): string {
  return uuidv4();
}

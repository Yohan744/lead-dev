import { PubSub } from '@google-cloud/pubsub';
import dotenv from 'dotenv';

dotenv.config();

const pubSubClient = new PubSub();
const name = 'dmii2-8';

async function publishMessage(data) {
  const dataBuffer = Buffer.from(data);

  try {
    const messageId = await pubSubClient.topic(name).publish(dataBuffer);
    console.log(`Message ${messageId} published.`);
  } catch (error) {
    console.error(`Error publishing message: ${error.message}`);
  }
}

export default publishMessage;
import { PubSub } from '@google-cloud/pubsub';
import Image from './Image.js';

// Creates a client; cache this for further use
const pubSubClient = new PubSub();

function listenForMessages(subscriptionNameOrId, timeout) {
  // References an existing subscription; if you are unsure if the
  // subscription will exist, try the optimisticSubscribe sample.
  const subscription = pubSubClient.subscription(subscriptionNameOrId);
  const image = new Image();

  // Create an event handler to handle messages
  let messageCount = 0;
  const messageHandler = async message => {
    console.log(`Received message ${message.id}:`);
    console.log(`\tData: ${message.data}`);
    console.log(`\tAttributes: ${message}`);
    await image.getImage(message.data, 'all');
    messageCount += 1;

    // "Ack" (acknowledge receipt of) the message
    message.ack();
  };

  // Listen for new messages until timeout is hit
  subscription.on('message', messageHandler);

  // Wait a while for the subscription to run. (Part of the sample only.)
  setTimeout(() => {
    subscription.removeListener('message', messageHandler);
    console.log(`${messageCount} message(s) received.`);
  }, timeout * 1000);
}
// [END pubsub_subscriber_async_pull]
// [END pubsub_quickstart_subscriber]

export default function main(
  subscriptionNameOrId = 'dmii2-8',
  timeout = 60
) {
  timeout = Number(timeout);
  listenForMessages(subscriptionNameOrId, timeout);
}
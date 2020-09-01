const { Expo } = require('expo-server-sdk');
let expo = new Expo();

async function pushNotification(expoToken,title,body,data){
    let messages = [];

    if (!Expo.isExpoPushToken(expoToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        return;
    }

    messages.push({
        to: expoToken,
        sound: 'default',
        body: body,
        data: { withSome: data },
    })

    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];

    await (async () => {
        for (let chunk of chunks) {
          try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log(ticketChunk);
            tickets.push(...ticketChunk);
          } catch (error) {
            console.error(error);
          }
        }
      })();
}

module.exports = {pushNotification}
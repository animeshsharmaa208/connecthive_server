const { Expo } = require("expo-server-sdk");
const PushNotifyToken = require("../models/pushNotifyToken");

exports.sendError = (res, error, status = 401) => {
  res.status(status).json({ success: false, error });
};

// exports.sendPushNotification =  async (reciepentId, sender, text, result, senderName, type="chat") => {
//   let expo = new Expo();
//   // console.log(senderName);
//   // Create the messages that you want to send to clients
//   let messages = [];
//   const tokenUser = await PushNotifyToken.findOne({ user: reciepentId });
//   tokenUser.token.map((pushToken) => {
//     // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

//     // Check that all your push tokens appear to be valid Expo push tokens
//     if (!Expo.isExpoPushToken(pushToken)) {
//       console.error(`Push token ${pushToken} is not a valid Expo push token`);
//     }

//     // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
//     messages.push({
//       to: pushToken,
//       sound: "default",
//       title: type === "chat" ? `New message from ${senderName}` : `${senderName} ${text}`,
//       body: type === "chat" ? text : "",
//       data:  result 
//     });
//   });

//   let chunks = expo.chunkPushNotifications(messages);
//   let tickets = [];
//   (async () => {
//     // Send the chunks to the Expo push notification service. There are
//     // different strategies you could use. A simple one is to send one chunk at a
//     // time, which nicely spreads the load out over time:
//     for (let chunk of chunks) {
//       try {
//         let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
//         // console.log(ticketChunk);
//         tickets.push(...ticketChunk);
//         return ticketChunk;
//         // NOTE: If a ticket contains an error code in ticket.details.error, you
//         // must handle it appropriately. The error codes are listed in the Expo
//         // documentation:
//         // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
//       } catch (error) {
//         console.error(error);
//       }
//     }
//   })();
// }

exports.sendPushNotification =  async (reciepentId, sender, text, result, senderName, type="chat") => {
  let expo = new Expo();

  let messages = [];
  const tokenUser = await PushNotifyToken.findOne({ user: reciepentId });
  if(tokenUser) {
    tokenUser.token.map((pushToken) => {
    
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
      }
  
      messages.push({
        to: pushToken,
        sound: "default",
        title: type === "chat" ? `New message from ${senderName}` : `${senderName} ${text}`,
        body: type === "chat" ? text : "",
        data:  result 
      });
    });
  }
  

  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  (async () => {
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        let invalidTokens = [];
        ticketChunk.forEach((ticket, index) => {
          if (ticket.details && ticket.details.error) {
            console.error(`The push token ${messages[index].to} is invalid: ${ticket.details.error}`);
            invalidTokens.push(tokenUser.token[index]);
          }
        });
        if (invalidTokens.length > 0) {
          await PushNotifyToken.updateOne({ user: reciepentId }, { $pull: { token: { $in: invalidTokens } } });
        }
      } catch (error) {
        console.error(error);
      }
    }
  })();
}

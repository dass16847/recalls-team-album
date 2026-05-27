import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export const createTradeNotification = async (recipientUserId, type, tradeData) => {
  try {
    await addDoc(collection(db, 'tradeNotifications'), {
      targetUserId: recipientUserId,
      type: type,
      title: getNotificationTitle(type, tradeData),
      message: getNotificationMessage(type, tradeData),
      tradeData: tradeData,
      read: false,
      createdAt: new Date()
    });
    console.log('Notification created for user:', recipientUserId);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

const getNotificationTitle = (type, tradeData) => {
  switch (type) {
    case 'trade_offer':
      return '🔄 Someone wants your card!';
    case 'trade_completed':
      return '✅ Trade Completed!';
    case 'trade_available':
      return '🆕 New Trade Available!';
    default:
      return '📢 Trade Update';
  }
};

const getNotificationMessage = (type, tradeData) => {
  switch (type) {
    case 'trade_offer':
      return `${tradeData.traderEmail} wants to trade their ${tradeData.offeringCard} for your ${tradeData.wantingCard}`;
    case 'trade_completed':
      return `Your trade was completed! You received ${tradeData.receivedCard} for ${tradeData.givenCard}`;
    case 'trade_available':
      return `New trade: ${tradeData.offeringCard} for ${tradeData.wantingCard}`;
    default:
      return 'Trade update available';
  }
};

export const notifyRelevantUsers = async (newTrade) => {
  try {
    console.log('Looking for users who have:', newTrade.wantingCard);

    // Find users who have the card that the trade wants
    const userCollectionQuery = query(
      collection(db, 'userCollections'),
      where('cardData.name', '==', newTrade.wantingCard)
    );

    const userCards = await getDocs(userCollectionQuery);
    const notifiedUsers = new Set();

    for (const cardDoc of userCards.docs) {
      const cardData = cardDoc.data();
      const userId = cardData.userId;

      // Don't notify the trade creator
      if (userId !== newTrade.userId && !notifiedUsers.has(userId)) {
        console.log('Notifying user:', userId, 'about trade for:', newTrade.wantingCard);

        await createTradeNotification(userId, 'trade_offer', {
          traderEmail: newTrade.userEmail,
          offeringCard: newTrade.offeringCard,
          wantingCard: newTrade.wantingCard,
          tradeId: newTrade.id
        });

        notifiedUsers.add(userId);
      }
    }

    console.log(`Notified ${notifiedUsers.size} users about the new trade`);
  } catch (error) {
    console.error('Error notifying users:', error);
  }
};
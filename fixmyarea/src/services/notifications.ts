import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { NotificationItem, ReportStatus } from '../types';

export const sendStatusChangeNotifications = async (
  reportId: string,
  category: string,
  reporterId: string,
  newStatus: ReportStatus,
  changedByName: string = 'Municipal Authority'
) => {
  try {
    const userIdsToNotify = new Set<string>();
    userIdsToNotify.add(reporterId);

    // Get all upvoters for this report
    const upvotesRef = collection(db, 'reports', reportId, 'upvotes');
    const upvotesSnap = await getDocs(upvotesRef);
    upvotesSnap.forEach((docSnap) => {
      const upvoterId = docSnap.id;
      if (upvoterId) userIdsToNotify.add(upvoterId);
    });

    const batch = writeBatch(db);
    const notificationsCol = collection(db, 'notifications');

    userIdsToNotify.forEach((userId) => {
      const isReporter = userId === reporterId;
      const message = isReporter
        ? `Your ${category} report has been updated to "${newStatus}" by ${changedByName}.`
        : `An issue you supported (${category}) has been updated to "${newStatus}".`;

      const newNotifRef = doc(notificationsCol);
      batch.set(newNotifRef, {
        user_id: userId,
        report_id: reportId,
        message,
        read: false,
        created_at: serverTimestamp(),
      });
    });

    await batch.commit();
  } catch (err) {
    console.error('Error sending status change notifications:', err);
  }
};

export const subscribeUserNotifications = (
  userId: string,
  onUpdate: (notifications: NotificationItem[]) => void
) => {
  const q = query(
    collection(db, 'notifications'),
    where('user_id', '==', userId),
    orderBy('created_at', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifs: NotificationItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<NotificationItem, 'id'>),
      }));
      onUpdate(notifs);
    },
    (error) => {
      console.error('Error listening to notifications:', error);
    }
  );
};

export const markNotificationAsRead = async (notificationId: string) => {
  const notifRef = doc(db, 'notifications', notificationId);
  await updateDoc(notifRef, { read: true });
};

export const markAllNotificationsAsRead = async (notificationIds: string[]) => {
  if (notificationIds.length === 0) return;
  const batch = writeBatch(db);
  notificationIds.forEach((id) => {
    const ref = doc(db, 'notifications', id);
    batch.update(ref, { read: true });
  });
  await batch.commit();
};

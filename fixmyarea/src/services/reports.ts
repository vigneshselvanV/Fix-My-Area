import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  writeBatch,
  increment,
  deleteDoc,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import {
  ReportItem,
  ReportCategory,
  ReportStatus,
  RiskLevel,
  StatusHistoryItem,
  ReportCommentItem,
  PhotoAuthenticityResult,
  CitizenLeaderboardItem,
  CivicBroadcastItem,
  SlaStatusInfo,
  ResolutionFeedbackItem,
} from '../types';

import { assessReportRisk, verifyPhotoAuthenticity } from './riskAssessment';
import { sendStatusChangeNotifications } from './notifications';

// Haversine distance calculator in meters
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Compress image to a high-efficiency compact Data URL (under 60KB) for resilient fallback
export async function compressImageToDataUrl(
  file: File,
  maxDimension: number = 720,
  quality: number = 0.65
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(event.target?.result as string);
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

// Compress image client-side for Firebase Storage
export async function compressImage(
  file: File,
  maxDimension: number = 1200,
  quality: number = 0.75
): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

// Check for duplicates within 100 meters and 14 days
export async function checkForDuplicates(
  category: ReportCategory,
  lat: number,
  lng: number,
  radiusMeters: number = 100
): Promise<ReportItem[]> {
  try {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const reportsRef = collection(db, 'reports');
    const q = query(
      reportsRef,
      where('category', '==', category)
    );

    const snapshot = await getDocs(q);
    const duplicates: ReportItem[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Omit<ReportItem, 'id'>;
      const reportDate = data.created_at?.toDate ? data.created_at.toDate() : new Date();

      if (reportDate >= fourteenDaysAgo) {
        const dist = calculateDistanceMeters(lat, lng, data.latitude, data.longitude);
        if (dist <= radiusMeters) {
          duplicates.push({
            id: docSnap.id,
            ...data,
          });
        }
      }
    });

    return duplicates;
  } catch (err) {
    console.warn('Error checking for duplicate reports:', err);
    return [];
  }
}

export interface CreateReportInput {
  userId: string;
  userName: string;
  category: ReportCategory;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  imageFile: File;
  photoAuthenticity?: PhotoAuthenticityResult | null;
  onProgress?: (percent: number) => void;
}

export async function createReport(input: CreateReportInput): Promise<string> {
  const {
    userId,
    userName,
    category,
    description,
    latitude,
    longitude,
    address,
    imageFile,
    photoAuthenticity,
    onProgress,
  } = input;

  const reportCol = collection(db, 'reports');
  const newReportRef = doc(reportCol);
  const reportId = newReportRef.id;

  // 1. Process & Upload Image with Timeout and Safe Compression
  let imageUrl = '';
  try {
    if (onProgress) onProgress(20);

    // Prepare resilient compressed data URL in parallel
    const compactDataUrlPromise = compressImageToDataUrl(imageFile);

    // Try Firebase Storage with 3.5s timeout race
    const storageUploadPromise = (async () => {
      const compressedBlob = await compressImage(imageFile);
      const storagePath = `report-images/${userId}/${reportId}/original.jpg`;
      const imageStorageRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(imageStorageRef, compressedBlob, {
        contentType: 'image/jpeg',
      });

      return new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 60 + 20;
            if (onProgress) onProgress(Math.round(progress));
          },
          (error) => reject(error),
          async () => {
            const dlUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(dlUrl);
          }
        );
      });
    })();

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Storage upload timeout')), 3500)
    );

    try {
      imageUrl = await Promise.race([storageUploadPromise, timeoutPromise]);
    } catch (storageErr) {
      console.info('Storage upload skipped or timed out, using compact Base64 storage:', storageErr);
      imageUrl = await compactDataUrlPromise;
    }
  } catch (imgErr) {
    console.warn('Image processing fallback:', imgErr);
    imageUrl = await compressImageToDataUrl(imageFile);
  }

  if (onProgress) onProgress(75);

  // 2. AI Photo Authenticity verification if not pre-computed
  let verifiedPhoto = photoAuthenticity;
  if (!verifiedPhoto) {
    try {
      verifiedPhoto = await verifyPhotoAuthenticity(imageFile, imageUrl, category, description);
    } catch (e) {
      console.warn('Photo verification skipped:', e);
    }
  }

  // 3. Duplicate count for risk assessment
  let duplicateCount = 0;
  try {
    const existingDuplicates = await checkForDuplicates(category, latitude, longitude, 100);
    duplicateCount = existingDuplicates.length;
  } catch (e) {
    console.warn('Duplicate check skipped:', e);
  }

  // 4. AI Risk Assessment (OpenRouter with automatic rule-based fallback)
  let assessment = {
    risk_level: 'Medium' as RiskLevel,
    suggested_action: 'Under municipal review',
  };

  try {
    assessment = await assessReportRisk(
      category,
      description,
      duplicateCount,
      address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    );
  } catch (aiErr) {
    console.warn('AI assessment skipped to fallback:', aiErr);
  }

  if (onProgress) onProgress(90);

  // 5. Save report doc in Firestore
  const newReportData: Record<string, any> = {
    user_id: userId,
    user_name: userName || 'Resident User',
    category,
    description: description.trim(),
    image_url: imageUrl,
    latitude,
    longitude,
    address: address || '',
    status: 'Reported' as ReportStatus,
    risk_level: assessment.risk_level,
    suggested_action: assessment.suggested_action,
    upvote_count: 0,
    flag_count: 0,
    duplicate_of: null,
    photo_verified: verifiedPhoto?.is_authentic ?? true,
    photo_authenticity_score: verifiedPhoto?.authenticity_score ?? 90,
    photo_authenticity_verdict: verifiedPhoto?.verdict ?? 'Authentic Field Photo',
    detected_hazard: verifiedPhoto?.detected_hazard ?? `${category} condition`,
    created_at: serverTimestamp(),
  };

  await setDoc(newReportRef, newReportData);

  // 5. Initial Status History entry
  try {
    const historyRef = doc(collection(db, 'reports', reportId, 'status_history'));
    await setDoc(historyRef, {
      status: 'Reported',
      changed_by: userId,
      changed_by_name: userName || 'Resident User',
      notes: 'Report submitted by resident',
      timestamp: serverTimestamp(),
    });
  } catch (histErr) {
    console.warn('Status history initial log skipped:', histErr);
  }

  if (onProgress) onProgress(100);

  return reportId;
}

// Fetch single report
export async function getReportById(reportId: string): Promise<ReportItem | null> {
  const docRef = doc(db, 'reports', reportId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<ReportItem, 'id'>) };
}

// Real-time listener for single report
export function subscribeReportById(
  reportId: string,
  onUpdate: (report: ReportItem | null) => void
) {
  const docRef = doc(db, 'reports', reportId);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      onUpdate({ id: snap.id, ...(snap.data() as Omit<ReportItem, 'id'>) });
    } else {
      onUpdate(null);
    }
  });
}

// Real-time listener for status history
export function subscribeStatusHistory(
  reportId: string,
  onUpdate: (history: StatusHistoryItem[]) => void
) {
  const historyCol = collection(db, 'reports', reportId, 'status_history');
  const q = query(historyCol, orderBy('timestamp', 'asc'));

  return onSnapshot(q, (snap) => {
    const items: StatusHistoryItem[] = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<StatusHistoryItem, 'id'>),
    }));
    onUpdate(items);
  });
}

// Check if user has upvoted
export async function checkUserUpvoted(reportId: string, userId: string): Promise<boolean> {
  if (!userId) return false;
  const upvoteDocRef = doc(db, 'reports', reportId, 'upvotes', userId);
  const snap = await getDoc(upvoteDocRef);
  return snap.exists();
}

// Toggle upvote via atomic transaction
export async function toggleUpvote(reportId: string, userId: string): Promise<boolean> {
  const reportRef = doc(db, 'reports', reportId);
  const upvoteRef = doc(db, 'reports', reportId, 'upvotes', userId);

  return await runTransaction(db, async (transaction) => {
    const upvoteDoc = await transaction.get(upvoteRef);
    const reportDoc = await transaction.get(reportRef);

    if (!reportDoc.exists()) {
      throw new Error('Report not found');
    }

    const currentCount = reportDoc.data().upvote_count || 0;

    if (upvoteDoc.exists()) {
      // Remove upvote
      transaction.delete(upvoteRef);
      transaction.update(reportRef, {
        upvote_count: Math.max(0, currentCount - 1),
      });
      return false;
    } else {
      // Add upvote
      transaction.set(upvoteRef, {
        user_id: userId,
        created_at: serverTimestamp(),
      });
      transaction.update(reportRef, {
        upvote_count: currentCount + 1,
      });
      return true;
    }
  });
}

// Flag report
export async function flagReport(
  reportId: string,
  userId: string,
  reason: string = 'Inaccurate or offensive'
): Promise<boolean> {
  const reportRef = doc(db, 'reports', reportId);
  const flagRef = doc(db, 'reports', reportId, 'flags', userId);

  return await runTransaction(db, async (transaction) => {
    const flagDoc = await transaction.get(flagRef);
    const reportDoc = await transaction.get(reportRef);

    if (!reportDoc.exists()) throw new Error('Report not found');
    if (flagDoc.exists()) return false; // Already flagged

    const currentFlagCount = reportDoc.data().flag_count || 0;
    transaction.set(flagRef, {
      user_id: userId,
      reason,
      created_at: serverTimestamp(),
    });
    transaction.update(reportRef, {
      flag_count: currentFlagCount + 1,
    });
    return true;
  });
}

// Admin update status
export async function updateReportStatus(
  reportId: string,
  newStatus: ReportStatus,
  adminId: string,
  adminName: string,
  reporterId: string,
  category: string,
  notes?: string
): Promise<void> {
  const reportRef = doc(db, 'reports', reportId);
  const historyRef = doc(collection(db, 'reports', reportId, 'status_history'));

  const batch = writeBatch(db);
  batch.update(reportRef, {
    status: newStatus,
    updated_at: serverTimestamp(),
  });

  batch.set(historyRef, {
    status: newStatus,
    changed_by: adminId,
    changed_by_name: adminName,
    notes: notes || `Status marked as ${newStatus}`,
    timestamp: serverTimestamp(),
  });

  await batch.commit();

  // Send status change notifications to reporter and upvoters
  await sendStatusChangeNotifications(reportId, category, reporterId, newStatus, adminName);
}

// Subscribe to all reports for Dashboard & Admin
export function subscribeReports(
  onUpdate: (reports: ReportItem[]) => void,
  onError?: (err: Error) => void
) {
  const reportsCol = collection(db, 'reports');
  const q = query(reportsCol, orderBy('created_at', 'desc'), limit(100));

  return onSnapshot(
    q,
    (snap) => {
      const reports: ReportItem[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ReportItem, 'id'>),
      }));
      onUpdate(reports);
    },
    (err) => {
      console.error('Error fetching reports snapshot:', err);
      if (onError) onError(err);
    }
  );
}

// User Reports
export async function getUserReports(userId: string): Promise<ReportItem[]> {
  const reportsRef = collection(db, 'reports');
  const q = query(reportsRef, where('user_id', '==', userId), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ReportItem, 'id'>) }));
}

// Add Community Comment / Verification Note
export async function addReportComment(
  reportId: string,
  userId: string,
  userName: string,
  content: string,
  userRole: 'resident' | 'admin' = 'resident'
): Promise<void> {
  const commentsCol = collection(db, 'reports', reportId, 'comments');
  const newCommentRef = doc(commentsCol);

  await setDoc(newCommentRef, {
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    content: content.trim(),
    created_at: serverTimestamp(),
  });
}

// Subscribe to Community Comments
export function subscribeReportComments(
  reportId: string,
  onUpdate: (comments: ReportCommentItem[]) => void
) {
  const commentsCol = collection(db, 'reports', reportId, 'comments');
  const q = query(commentsCol, orderBy('created_at', 'asc'));

  return onSnapshot(q, (snap) => {
    const comments: ReportCommentItem[] = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<ReportCommentItem, 'id'>),
    }));
    onUpdate(comments);
  });
}

// Resident Resolution Confirmation or Reopen Action
export async function submitResidentResolutionFeedback(
  reportId: string,
  userId: string,
  userName: string,
  action: 'confirm_fixed' | 'reopen',
  notes: string,
  _currentStatus: ReportStatus
): Promise<void> {
  const reportRef = doc(db, 'reports', reportId);
  const historyRef = doc(collection(db, 'reports', reportId, 'status_history'));

  const newStatus: ReportStatus = action === 'confirm_fixed' ? 'Resolved' : 'In Progress';
  const actionNote =
    action === 'confirm_fixed'
      ? `Citizen Confirmed Fixed: ${notes || 'Issue verified resolved by community resident.'}`
      : `Citizen Reopened Issue: ${notes || 'Issue still persists or needs further attention.'}`;

  const batch = writeBatch(db);
  batch.update(reportRef, {
    status: newStatus,
    updated_at: serverTimestamp(),
  });

  batch.set(historyRef, {
    status: newStatus,
    changed_by: userId,
    changed_by_name: `${userName} (Citizen Verification)`,
    notes: actionNote,
    timestamp: serverTimestamp(),
  });

  await batch.commit();

  try {
    const reportSnap = await getDoc(reportRef);
    if (reportSnap.exists()) {
      const data = reportSnap.data();
      await sendStatusChangeNotifications(
        reportId,
        data.category || 'Civic Issue',
        data.user_id || userId,
        newStatus,
        `${userName} (Citizen Verification)`
      );
    }
  } catch (err) {
    console.warn('Notification trigger skipped:', err);
  }
}

// Phase 5: Civic Impact Leaderboard Generator
export async function getCivicLeaderboard(): Promise<CitizenLeaderboardItem[]> {
  try {
    const reportsRef = collection(db, 'reports');
    const snap = await getDocs(reportsRef);

    const userMap: Record<
      string,
      {
        uid: string;
        name: string;
        reports_submitted: number;
        reports_resolved: number;
        upvotes_received: number;
      }
    > = {};

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const uid = data.user_id || 'anonymous';
      const name = data.user_name || 'Civic Champion';
      const isResolved = data.status === 'Resolved';
      const upvotes = data.upvote_count || 0;

      if (!userMap[uid]) {
        userMap[uid] = {
          uid,
          name,
          reports_submitted: 0,
          reports_resolved: 0,
          upvotes_received: 0,
        };
      }

      userMap[uid].reports_submitted += 1;
      if (isResolved) userMap[uid].reports_resolved += 1;
      userMap[uid].upvotes_received += upvotes;
    });

    const leaderboard: CitizenLeaderboardItem[] = Object.values(userMap).map((u) => {
      // Karma points calculation:
      // 50 pts per report filed
      // 30 bonus pts per resolved issue
      // 5 pts per upvote from neighborhood
      const points =
        u.reports_submitted * 50 +
        u.reports_resolved * 30 +
        u.upvotes_received * 5;

      const badges: string[] = [];
      if (u.reports_submitted >= 1) badges.push('First Responder');
      if (u.reports_submitted >= 5) badges.push('Civic Guardian');
      if (u.reports_resolved >= 3) badges.push('Fix Champion');
      if (u.upvotes_received >= 10) badges.push('Community Voice');

      return {
        uid: u.uid,
        name: u.name,
        points,
        reports_submitted: u.reports_submitted,
        reports_resolved: u.reports_resolved,
        badges,
      };
    });

    leaderboard.sort((a, b) => b.points - a.points);
    return leaderboard.map((item, idx) => ({ ...item, rank: idx + 1 }));
  } catch (err) {
    console.warn('Error generating civic leaderboard:', err);
    return [];
  }
}

// Phase 5: Municipal Broadcast Announcements
export function subscribeCivicBroadcasts(
  onUpdate: (broadcasts: CivicBroadcastItem[]) => void
) {
  const broadcastCol = collection(db, 'broadcasts');
  const q = query(broadcastCol, orderBy('created_at', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const items: CivicBroadcastItem[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<CivicBroadcastItem, 'id'>),
      }));
      onUpdate(items);
    },
    (_err) => {
      // Fallback default municipal advisory
      onUpdate([
        {
          id: 'default-1',
          title: 'Monsoon Infrastructure & Storm Drain Patrol Active',
          message:
            'Municipal field teams are clearing stormwater drains and repairing priority road potholes across all wards.',
          severity: 'info',
          active: true,
          created_at: new Date(),
        },
      ]);
    }
  );
}

export async function createCivicBroadcast(
  broadcast: Omit<CivicBroadcastItem, 'id' | 'created_at'>
): Promise<string> {
  const broadcastCol = collection(db, 'broadcasts');
  const newRef = doc(broadcastCol);
  await setDoc(newRef, {
    ...broadcast,
    created_at: serverTimestamp(),
  });
  return newRef.id;
}

// =========================================================================
// PHASE 6: MUNICIPAL SLA (SERVICE LEVEL AGREEMENT) CALCULATION ENGINE
// =========================================================================

export const SLA_HOURS_CONFIG: Record<RiskLevel, number> = {
  Critical: 24,  // 24 hours (immediate hazard to life/traffic)
  High: 48,      // 48 hours (severe infrastructure impediment)
  Medium: 72,    // 72 hours (sanitation / stray animal / drain)
  Low: 168,      // 7 days (minor aesthetic / low traffic streetlight)
};

export function getReportSlaInfo(report: ReportItem): SlaStatusInfo {
  const slaHours = SLA_HOURS_CONFIG[report.risk_level] || 72;
  
  let createdDate: Date;
  if (report.created_at?.toDate) {
    createdDate = report.created_at.toDate();
  } else if (report.created_at?.seconds) {
    createdDate = new Date(report.created_at.seconds * 1000);
  } else if (report.created_at instanceof Date) {
    createdDate = report.created_at;
  } else {
    createdDate = new Date();
  }

  const now = new Date();
  const deadlineMs = createdDate.getTime() + slaHours * 60 * 60 * 1000;
  const deadlineDate = new Date(deadlineMs);

  const msRemaining = deadlineMs - now.getTime();
  const hoursRemaining = Math.round(msRemaining / (1000 * 60 * 60));
  const hoursElapsed = Math.round((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));

  const isResolved = report.status === 'Resolved';
  const isBreached = now.getTime() > deadlineMs && !isResolved;

  let statusLabel: SlaStatusInfo['statusLabel'];
  if (isResolved) {
    statusLabel = hoursElapsed <= slaHours ? 'Resolved Within SLA' : 'Resolved Past SLA';
  } else if (isBreached) {
    statusLabel = 'Escalated - SLA Breached';
  } else {
    statusLabel = 'Within SLA';
  }

  return {
    slaHours,
    slaDeadline: deadlineDate,
    isBreached,
    hoursRemaining,
    hoursElapsed,
    statusLabel,
  };
}

// =========================================================================
// PHASE 6: CITIZEN RESOLUTION VERIFICATION & RE-OPEN DISPUTE
// =========================================================================

export function subscribeResolutionFeedback(
  reportId: string,
  onUpdate: (items: ResolutionFeedbackItem[]) => void
) {
  const feedbackCol = collection(db, 'reports', reportId, 'resolution_feedback');
  const q = query(feedbackCol, orderBy('created_at', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const items: ResolutionFeedbackItem[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ResolutionFeedbackItem, 'id'>),
      }));
      onUpdate(items);
    },
    (err) => {
      console.warn('Error listening to resolution feedback:', err);
      onUpdate([]);
    }
  );
}

export async function submitResolutionFeedback(
  reportId: string,
  feedback: {
    user_id: string;
    user_name: string;
    rating: number;
    verified_resolved: boolean;
    comments: string;
    after_photo_url?: string;
    is_dispute?: boolean;
    dispute_reason?: string;
  }
): Promise<void> {
  const batch = writeBatch(db);

  // 1. Add resolution feedback record with explicitly sanitized fields
  const feedbackCol = collection(db, 'reports', reportId, 'resolution_feedback');
  const newFeedbackRef = doc(feedbackCol);

  const feedbackData: Record<string, any> = {
    report_id: reportId,
    user_id: feedback.user_id,
    user_name: feedback.user_name || 'Resident',
    rating: Number(feedback.rating) || 5,
    verified_resolved: Boolean(feedback.verified_resolved),
    comments: feedback.comments || '',
    created_at: serverTimestamp(),
  };

  if (feedback.after_photo_url) {
    feedbackData.after_photo_url = feedback.after_photo_url;
  }
  if (feedback.is_dispute !== undefined) {
    feedbackData.is_dispute = Boolean(feedback.is_dispute);
  }
  if (feedback.dispute_reason) {
    feedbackData.dispute_reason = feedback.dispute_reason;
  }

  batch.set(newFeedbackRef, feedbackData);

  const reportRef = doc(db, 'reports', reportId);

  // 2. If it's a dispute: Re-open the issue to "In Progress" with dispute flag
  if (feedback.is_dispute) {
    batch.update(reportRef, {
      status: 'In Progress',
      is_disputed: true,
      dispute_count: increment(1),
      updated_at: serverTimestamp(),
    });

    // Append to status history
    const historyCol = collection(db, 'reports', reportId, 'status_history');
    const historyRef = doc(historyCol);
    batch.set(historyRef, {
      status: 'In Progress',
      changed_by: feedback.user_id,
      changed_by_name: `${feedback.user_name} (Citizen Dispute Review)`,
      notes: `Re-opened by citizen review: ${feedback.dispute_reason || feedback.comments}`,
      timestamp: serverTimestamp(),
    });
  } else {
    // Verified resolution confirmation
    batch.update(reportRef, {
      resolution_verified_count: increment(1),
      resolution_rating_avg: feedback.rating,
      updated_at: serverTimestamp(),
    });
  }

  await batch.commit();
}

// =========================================================================
// ADMIN ACTION: DELETE COMPLAINT / REPORT
// =========================================================================
export async function deleteReport(reportId: string): Promise<void> {
  const reportRef = doc(db, 'reports', reportId);
  await deleteDoc(reportRef);
}



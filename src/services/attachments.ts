import {
  collection,
  doc,
  addDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import imageCompression from 'browser-image-compression';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Attachment } from '../types';

export async function compressAndSaveAttachment(
  wid: string,
  file: File,
  parentType: Attachment['parentType'],
  parentId: string,
  createdByUid: string
): Promise<string> {
  const collectionPath = `weddings/${wid}/attachments`;

  try {
    // Compress file client-side
    const options = {
      maxSizeMB: 0.6,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
      fileType: 'image/jpeg',
    };

    const compressedFile = await imageCompression(file, options);
    const base64Data = await imageCompression.getDataUrlFromFile(compressedFile);

    const attachmentData = {
      parentType,
      parentId,
      mime: 'image/jpeg',
      dataBase64: base64Data,
      createdBy: createdByUid,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'weddings', wid, 'attachments'), attachmentData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionPath);
    return '';
  }
}

export async function getAttachment(wid: string, attachmentId: string): Promise<Attachment | null> {
  const path = `weddings/${wid}/attachments/${attachmentId}`;
  try {
    const snap = await getDoc(doc(db, 'weddings', wid, 'attachments', attachmentId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Attachment;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

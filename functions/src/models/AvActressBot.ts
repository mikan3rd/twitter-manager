import dayjs from "dayjs";

import { AvActressBotsDB, FieldValue } from "../firebase/firestore";

export class AvActressBot {
  userId: string;
  selectedActressIds: number[];
  updatedAt: null | dayjs.Dayjs;
  createdAt: null | dayjs.Dayjs;

  constructor(
    userId: string,
    params: {
      userId: string;
      selectedActressIds?: number[];
      updatedAt?: FirebaseFirestore.Timestamp;
      createdAt?: FirebaseFirestore.Timestamp;
    },
  ) {
    const { selectedActressIds, updatedAt, createdAt } = params;
    this.userId = userId;
    this.selectedActressIds = selectedActressIds ?? [];
    this.updatedAt = updatedAt ? dayjs(updatedAt.toDate()) : null;
    this.createdAt = createdAt ? dayjs(createdAt.toDate()) : null;
  }

  addSelectedActressIds(selectedActressIds: this["selectedActressIds"]) {
    this.selectedActressIds = this.selectedActressIds.concat(selectedActressIds);
  }

  clearSelectedActressIds() {
    this.selectedActressIds = [];
  }

  toFirestoreObject() {
    const { userId, selectedActressIds, createdAt } = this;
    return {
      userId,
      selectedActressIds,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: createdAt ? createdAt.toDate() : FieldValue.serverTimestamp(),
    };
  }

  async saveFirestore() {
    const data = this.toFirestoreObject();
    await AvActressBotsDB.doc(this.userId).set(data, { merge: true });
  }
}

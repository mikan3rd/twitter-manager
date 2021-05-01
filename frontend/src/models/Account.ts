import dayjs from "dayjs";
import { immerable, produce } from "immer";

import firebase from "../firebase/clientApp";

export class Account {
  [immerable] = true;

  userId: string;
  username: string;
  accessToken: string;
  secret: string;
  name: string;
  updatedAt: null | dayjs.Dayjs;
  createdAt: null | dayjs.Dayjs;

  constructor(params: {
    userId: string;
    username: string;
    accessToken: string;
    secret: string;
    name: string;
    updatedAt?: firebase.firestore.Timestamp;
    createdAt?: firebase.firestore.Timestamp;
  }) {
    const { userId, username, accessToken, secret, name, updatedAt, createdAt } = params;
    this.userId = userId;
    this.username = username;
    this.accessToken = accessToken;
    this.secret = secret;
    this.name = name;
    this.updatedAt = updatedAt ? dayjs(updatedAt.toDate()) : null;
    this.createdAt = createdAt ? dayjs(createdAt.toDate()) : null;
  }

  async toFirestoreObject() {
    const { userId, username, accessToken, secret, name } = this;
    const doc = await firebase.firestore().collection("accounts").doc(userId).get();
    return {
      userId,
      username,
      accessToken,
      secret,
      name,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: doc.exists ? doc.data()?.createdAt : firebase.firestore.FieldValue.serverTimestamp(),
    };
  }

  async saveFirestore() {
    const data = await this.toFirestoreObject();
    await firebase.firestore().collection("accounts").doc(this.userId).set(data, { merge: true });
  }
}

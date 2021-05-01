import { immerable, produce } from "immer";

import firebase from "../firebase/clientApp";

export class Account {
  [immerable] = true;

  userId: string;
  username: string;
  accessToken: string;
  secret: string;
  name: string;

  constructor(params: { userId: string; username: string; accessToken: string; secret: string; name: string }) {
    const { userId, username, accessToken, secret, name } = params;
    this.userId = userId;
    this.username = username;
    this.accessToken = accessToken;
    this.secret = secret;
    this.name = name;
  }

  toFirestoreObject() {
    const { userId, username, accessToken, secret, name } = this;
    return { userId, username, accessToken, secret, name };
  }

  async saveFirestore() {
    await firebase.firestore().collection("accounts").doc(this.userId).set(this.toFirestoreObject(), { merge: true });
  }
}

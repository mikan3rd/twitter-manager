import dayjs from "dayjs";
import { immerable, produce } from "immer";
import { toast } from "react-semantic-toasts";

import firebase from "../firebase/clientApp";
import { AccountsDB } from "../firebase/firestore";

export const BotTypeList = ["None", "AvActress"] as const;
export type BotType = typeof BotTypeList[number];

export class Account {
  [immerable] = true;

  userId: string;
  username: string;
  accessToken: string;
  secret: string;
  name: string;
  profileImageUrl: string;
  botType: BotType;
  updatedAt: null | dayjs.Dayjs;
  createdAt: null | dayjs.Dayjs;

  constructor(params: {
    userId: string;
    username: string;
    accessToken: string;
    secret: string;
    name: string;
    profileImageUrl: string;
    botType?: BotType;
    updatedAt?: firebase.firestore.Timestamp;
    createdAt?: firebase.firestore.Timestamp;
  }) {
    const { userId, username, accessToken, secret, name, profileImageUrl, botType, updatedAt, createdAt } = params;
    this.userId = userId;
    this.username = username;
    this.accessToken = accessToken;
    this.secret = secret;
    this.name = name;
    this.profileImageUrl = profileImageUrl;
    this.botType = botType ?? "None";
    this.updatedAt = updatedAt ? dayjs(updatedAt.toDate()) : null;
    this.createdAt = createdAt ? dayjs(createdAt.toDate()) : null;
  }

  setBotType(boyType: this["botType"]) {
    return produce(this, (draft) => {
      draft.botType = boyType;
    });
  }

  async saveFirestore() {
    const { name, botType, createdAt } = this;
    await AccountsDB.doc(this.userId).set(
      {
        botType,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: createdAt ? createdAt.toDate() : firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    toast({
      type: "success",
      title: `${name}の更新に成功しました`,
    });
  }

  async saveFirestoreForTwitterAuth() {
    const { userId, username, accessToken, secret, name, profileImageUrl } = this;
    const doc = await AccountsDB.doc(userId).get();
    await AccountsDB.doc(this.userId).set(
      {
        userId,
        username,
        accessToken,
        secret,
        name,
        profileImageUrl,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: doc.exists ? doc.data()?.createdAt : firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    toast({
      type: "success",
      title: `${name}の更新に成功しました`,
    });
  }
}

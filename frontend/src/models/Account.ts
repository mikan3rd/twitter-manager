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
  updatedAt: null | dayjs.Dayjs;
  createdAt: null | dayjs.Dayjs;
  botType: BotType;

  constructor(params: {
    userId: string;
    username: string;
    accessToken: string;
    secret: string;
    name: string;
    botType?: BotType;
    updatedAt?: firebase.firestore.Timestamp;
    createdAt?: firebase.firestore.Timestamp;
  }) {
    const { userId, username, accessToken, secret, name, botType, updatedAt, createdAt } = params;
    this.userId = userId;
    this.username = username;
    this.accessToken = accessToken;
    this.secret = secret;
    this.name = name;
    this.botType = botType ?? "None";
    this.updatedAt = updatedAt ? dayjs(updatedAt.toDate()) : null;
    this.createdAt = createdAt ? dayjs(createdAt.toDate()) : null;
  }

  setBotType(boyType: BotType) {
    return produce(this, (draft) => {
      draft.botType = boyType;
    });
  }

  async toFirestoreObject() {
    const { userId, username, accessToken, secret, name, botType } = this;
    const doc = await AccountsDB.doc(userId).get();
    return {
      userId,
      username,
      accessToken,
      secret,
      name,
      botType,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: doc.exists ? doc.data()?.createdAt : firebase.firestore.FieldValue.serverTimestamp(),
    };
  }

  async saveFirestore() {
    const data = await this.toFirestoreObject();
    console.log(data);
    await AccountsDB.doc(this.userId).set(data, { merge: true });
    toast({
      type: "success",
      title: "アカウントの更新に成功しました",
    });
  }
}

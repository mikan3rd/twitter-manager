import admin from "firebase-admin";

export const { FieldValue } = admin.firestore;

export const db = admin.firestore();
export const AccountsDB = db.collection("accounts");
export const AvActressBotsDB = db.collection("avActressBots");

export const BotTypeList = ["None", "AvActress"] as const;
export type BotType = typeof BotTypeList[number];

export type AccountType = {
  userId: string;
  username: string;
  accessToken: string;
  secret: string;
  name: string;
  botType: BotType;
};

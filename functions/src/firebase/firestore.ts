import admin from "firebase-admin";

export const db = admin.firestore();

export const AccountsDB = db.collection("accounts");

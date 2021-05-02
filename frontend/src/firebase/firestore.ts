import firebase from "./clientApp";

export const db = firebase.firestore();

export const AccountsDB = db.collection("accounts");

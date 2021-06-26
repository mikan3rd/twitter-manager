import React from "react";
import { toast } from "react-semantic-toasts";

import firebase from "../firebase/clientApp";
import { Account } from "../models/Account";

type TwitterCredentialType = Omit<firebase.auth.UserCredential, "credential" | "additionalUserInfo"> & {
  credential: { accessToken: string; secret: string };
  additionalUserInfo: {
    username: string;
    profile: {
      id_str: string;
      name: string;
      profile_image_url_https: string;
    };
  };
};

export const useTwitterAuth = () => {
  const logout = React.useCallback(async () => {
    await firebase.auth().signOut();
  }, []);

  const connectTwitter = React.useCallback(async () => {
    const provider = new firebase.auth.TwitterAuthProvider();
    provider.setCustomParameters({ force_login: true });

    const userCredential = await firebase.auth().signInWithPopup(provider);

    const {
      credential: { accessToken, secret },
      additionalUserInfo: {
        username,
        profile: { id_str: userId, name, profile_image_url_https: profileImageUrl },
      },
    } = userCredential as unknown as TwitterCredentialType;

    const account = new Account({ userId, username, accessToken, secret, name, profileImageUrl });
    await account.saveFirestoreForTwitterAuth();

    logout();

    toast({
      type: "success",
      title: "Twitter連携に成功しました",
    });
  }, [logout]);

  return { connectTwitter };
};

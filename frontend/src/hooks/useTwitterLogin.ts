import { toast } from "react-semantic-toasts";

import firebase from "../firebase/clientApp";

type TwitterCredentialType = Omit<firebase.auth.UserCredential, "credential" | "additionalUserInfo"> & {
  credential: { accessToken: string; secret: string };
  additionalUserInfo: { username: string; profile: { id_str: string } };
};

export const useTwitterLogin = () => {
  const connectTwitter = async () => {
    const provider = new firebase.auth.TwitterAuthProvider();
    provider.setCustomParameters({ force_login: true });

    const userCredential = await firebase.auth().signInWithPopup(provider);
    console.log(userCredential);

    const {
      credential: { accessToken, secret },
      additionalUserInfo: {
        username,
        profile: { id_str: userId },
      },
      user,
    } = (userCredential as unknown) as TwitterCredentialType;

    toast({
      type: "success",
      title: "Twitter連携に成功しました",
    });
  };

  return { connectTwitter };
};

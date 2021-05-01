import React from "react";
import { toast } from "react-semantic-toasts";

import firebase from "../firebase/clientApp";
import { Account } from "../models/Account";

export const useAccount = () => {
  const [accounts, setAccounts] = React.useState<Account[]>([]);

  const getAccounts = React.useCallback(async () => {
    const docs = await firebase.firestore().collection("accounts").get();

    const nextAccounts: Account[] = [];
    docs.forEach((doc) => {
      const data = doc.data();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const account = new Account(data as any);
      nextAccounts.push(account);
      setAccounts(nextAccounts);
    });
  }, []);

  React.useEffect(() => {
    getAccounts();
  }, [getAccounts]);

  return { accounts, getAccounts };
};

import { produce } from "immer";
import React from "react";

import { AccountsDB } from "../firebase/firestore";
import { Account } from "../models/Account";

export const useAccount = () => {
  const [accounts, setAccounts] = React.useState<Account[]>([]);

  const getAccounts = React.useCallback(async () => {
    const docs = await AccountsDB.get();

    const nextAccounts: Account[] = [];
    docs.forEach((doc) => {
      const data = doc.data();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const account = new Account(data as any);
      nextAccounts.push(account);
    });

    setAccounts(nextAccounts);
  }, []);

  const changeAccount = React.useCallback(
    (targetAccount: Account) => {
      const nextAccounts = produce(accounts, (draftAccounts) => {
        const index = draftAccounts.findIndex((account) => account.userId === targetAccount.userId);
        if (index >= 0) {
          draftAccounts[index] = targetAccount;
        }
      });
      setAccounts(nextAccounts);
    },
    [accounts],
  );

  React.useEffect(() => {
    getAccounts();
  }, [getAccounts]);

  return {
    accounts,
    getAccounts,
    changeAccount,
  };
};

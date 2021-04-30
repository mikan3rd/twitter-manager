import { css } from "@emotion/react";
import React from "react";
import { Button, Icon } from "semantic-ui-react";

import { useTwitterLogin } from "./hooks/useTwitterLogin";

export const App: React.VFC = () => {
  const { connectTwitter } = useTwitterLogin();
  return (
    <div>
      <Button color="twitter" size="big" onClick={connectTwitter}>
        <Icon name="twitter" />
        Twitter連携
      </Button>
    </div>
  );
};

import { css } from "@emotion/react";
import React from "react";
import { SemanticToastContainer } from "react-semantic-toasts";
import { Button, Container, Dropdown, Header, Icon, Segment } from "semantic-ui-react";

import { useTwitterLogin } from "./hooks/useTwitterLogin";

const BotTypeList = ["AvActress"] as const;

export const App: React.VFC = () => {
  const { connectTwitter } = useTwitterLogin();
  return (
    <>
      <Container
        css={css`
          &&& {
            margin-top: 16px;
          }
        `}
      >
        <Header as="h1" content="Twitterアカウント管理" />
        <Button color="twitter" size="big" onClick={connectTwitter}>
          <Icon name="twitter" />
          Twitterアカウント追加
        </Button>

        <Segment>TEST</Segment>
      </Container>

      <SemanticToastContainer position="top-center" />
    </>
  );
};

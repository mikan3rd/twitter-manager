import { css } from "@emotion/react";
import React from "react";
import { SemanticToastContainer } from "react-semantic-toasts";
import { Button, Container, Dropdown, Header, Icon, Image, Segment, Table } from "semantic-ui-react";

import { useAccount } from "./hooks/useAccount";
import { useTwitterAuth } from "./hooks/useTwitterAuth";
import { Account, BotType, BotTypeList } from "./models/Account";

const botTypeOptions = BotTypeList.map((boyType) => ({ value: boyType, text: boyType }));
const DateFormat = "YYYY/MM/DD(ddd) HH:mm";

export const App: React.VFC = () => {
  const { accounts, getAccounts } = useAccount();
  const { connectTwitter } = useTwitterAuth();

  const handleConnectTwitter = React.useCallback(async () => {
    await connectTwitter();
    await getAccounts();
  }, [connectTwitter, getAccounts]);

  const handleChangeAccount = React.useCallback(
    async (account: Account) => {
      await account.saveFirestore();
      await getAccounts();
    },
    [getAccounts],
  );

  return (
    <>
      <Container
        css={css`
          &&& {
            padding: 16px 0 64px;
          }
        `}
      >
        <Header as="h1" content="Twitter Manager" />
        <Button color="twitter" size="big" onClick={handleConnectTwitter}>
          <Icon name="twitter" />
          Twitterアカウントの追加 / 更新
        </Button>

        <div
          css={css`
            margin-top: 12px;
          `}
        >
          {accounts
            .sort((a, b) => ((a.createdAt?.unix() ?? 0) > (b.createdAt?.unix() ?? 0) ? 1 : -1))
            .map((account) => {
              const { userId, username, name, profileImageUrl, botType, createdAt, updatedAt } = account;
              return (
                <Segment key={userId}>
                  <div
                    css={css`
                      display: flex;
                      align-items: center;
                    `}
                  >
                    <Image src={profileImageUrl} size="tiny" circular />
                    <div
                      css={css`
                        margin-left: 12px;
                      `}
                    >
                      <Header content={name} />
                      <a href={`https://twitter.com/${username}`} target="_blank" rel="noreferrer">
                        @{username}
                      </a>
                    </div>
                  </div>
                  <Table celled striped unstackable>
                    <Table.Body>
                      <Table.Row>
                        <Table.Cell>userId</Table.Cell>
                        <Table.Cell>{userId}</Table.Cell>
                      </Table.Row>

                      <Table.Row>
                        <Table.Cell>botType</Table.Cell>
                        <Table.Cell>
                          <Dropdown
                            selection
                            options={botTypeOptions}
                            value={botType}
                            onChange={(e, d) => handleChangeAccount(account.setBotType(d.value as BotType))}
                          />
                        </Table.Cell>
                      </Table.Row>

                      <Table.Row>
                        <Table.Cell>updatedAt</Table.Cell>
                        <Table.Cell>{updatedAt?.format(DateFormat)}</Table.Cell>
                      </Table.Row>

                      <Table.Row>
                        <Table.Cell>createdAt</Table.Cell>
                        <Table.Cell>{createdAt?.format(DateFormat)}</Table.Cell>
                      </Table.Row>
                    </Table.Body>
                  </Table>
                </Segment>
              );
            })}
        </div>
      </Container>

      <SemanticToastContainer position="top-center" />
    </>
  );
};

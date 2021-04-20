import { css } from "@emotion/react";
import React from "react";

export const App = () => {
  return (
    <div>
      <header>
        <p
          css={css`
            background-color: red;
          `}
        >
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
          Learn React
        </a>
      </header>
    </div>
  );
};

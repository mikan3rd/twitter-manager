import dayjs from "dayjs";
import React from "react";
import ReactDOM from "react-dom";

import { App } from "./App";
import reportWebVitals from "./reportWebVitals";

import "dayjs/locale/ja";
import "semantic-ui-css/semantic.min.css";
import "react-semantic-toasts/styles/react-semantic-alert.css";

dayjs.locale("ja");

ReactDOM.render(<App />, document.getElementById("root"));

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

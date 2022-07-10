import { Web3ReactProvider } from "@web3-react/core";
import React, { useEffect } from "react";

import { Web3Provider } from "@ethersproject/providers";
import Content from "./Content";
import { POLLING_INTERVAL } from "../dapp/connectors";


export function getLibrary(provider: any): Web3Provider {
  const library = new Web3Provider(provider);
  library.pollingInterval = POLLING_INTERVAL;
  return library;
}

const App = function () {
  useEffect(() => {
    const bodyClass = {
      background: "#000000",
      margin: "0",
      padding: "0",

    }
    document.querySelector("body").style.background = bodyClass.background;
    document.querySelector("body").style.margin = bodyClass.margin;
    document.querySelector("body").style.padding = bodyClass.padding;
  })
  return (
    <>
      <Web3ReactProvider getLibrary={getLibrary}>
        <Content />
      </Web3ReactProvider>
    </>
  );
};

export default App;

import { Web3ReactProvider } from "@web3-react/core";
import React from "react";

import { Web3Provider } from "@ethersproject/providers";
import { Content } from "./Content";
import { POLLING_INTERVAL } from "../dapp/connectors";

export function getLibrary(provider: any): Web3Provider {
  const library = new Web3Provider(provider);
  library.pollingInterval = POLLING_INTERVAL;
  return library;
}

const App = function () {
  return (
    <>
      <Web3ReactProvider getLibrary={getLibrary}>
        <Content />
      </Web3ReactProvider>
    </>
  );
};

export default App;

import React, { useState, useEffect, createContext } from "react";
import Content from "./Content";

export const AppContext = createContext<any>({});

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

  const [ state, setState ] = useState([])
  const [ account, setAccount ] = useState(null)
  const [ library, setLibrary ] = useState(null)
  const [ provider, setProvider ] = useState(null)


  const AppContextValues = {
    state,
    setState,
    account,
    setAccount,
    library,
    setLibrary,
    provider,
    setProvider,
  };

  return (
    <AppContext.Provider value={AppContextValues}>
        <Content />
    </AppContext.Provider>
  );
};

export default App;
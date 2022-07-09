import Character from "../components/Character";
import React, { useEffect, useState } from "react";

import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";

import { injected, walletconnect } from "../dapp/connectors";
import { useEagerConnect, useInactiveListener } from "../dapp/hooks";

import { address, abi } from '../contract';
import { ethers } from "ethers";

export const Content = () => {
  const context = useWeb3React<Web3Provider>();
  const { connector, library, account, activate, deactivate, active, error } = context;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);


  const [loot, setLoot] = useState(null);

  useEffect(() => {
    if (!account || !active) return;
    const signer = library.getSigner();

    const contract = new ethers.Contract(
      address,
      abi,
      signer
    );
    (async () => {
      const chest = await contract.getChest(account);
      const foot = await contract.getFoot(account);
      const hand = await contract.getHand(account);
      const head = await contract.getHead(account);
      const neck = await contract.getNeck(account);
      const waist = await contract.getWaist(account);
      const ring = await contract.getRing(account);
      const weapon = await contract.getWeapon(account);

      const loot = {
        chest,
        foot,
        hand,
        head,
        neck,
        waist,
        ring,
        weapon
      }

      console.log('loot is', loot);
      setLoot(loot);
    })();

  }, [account, active]);

  // handle logic to recognize the connector currently being activated
  const [activatingConnector, setActivatingConnector] = useState<any>();
  useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector]);

  // handle logic to eagerly connect to the injected ethereum provider, if it exists and has granted access already
  const triedEager = useEagerConnect();

  // handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
  useInactiveListener(!triedEager || !!activatingConnector);

  const activating = (connection: typeof injected | typeof walletconnect) => connection === activatingConnector;
  const connected = (connection: typeof injected | typeof walletconnect) => connection === connector;
  const disabled = !triedEager || !!activatingConnector || connected(injected) || connected(walletconnect) || !!error;
  

  return (
    <div className="container min-h-screen mx-auto">
      <>
        {(!account || !active) &&
          <div style={{ width: "50%", margin: "auto" }}>
            <div className="card bordered">
              <figure>
                <img
                  className="h-24"
                  src="https://images.ctfassets.net/9sy2a0egs6zh/4zJfzJbG3kTDSk5Wo4RJI1/1b363263141cf629b28155e2625b56c9/mm-logo.svg"
                  alt="metamask" />
              </figure>
              <div className="card-body">
                <h2 className="card-title">
                  <a className="link link-hover" href="https://metamask.io/" target="_blank" rel="noreferrer">
                    MetaMask
                  </a>
                </h2>
                <p>A crypto wallet & gateway to blockchain apps</p>
                <div className="justify-end card-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={disabled}
                    onClick={() => {
                      setActivatingConnector(injected);
                      console.log("injected", injected);
                      activate(injected);
                    }}
                  >
                    <div className="px-2 py-4">
                      {activating(injected) && <p className="btn loading">loading...</p>}
                      {connected(injected) && (
                        <span role="img" aria-label="check">
                          ✅
                        </span>
                      )}
                    </div>
                    Connect with MetaMask
                  </button>
                  {(active || error) && connected(injected) && (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          if (connected(walletconnect)) {
                            (connector as any).close();
                          }
                          deactivate();
                        }}
                      >
                        Deactivate
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="card bordered">
              <figure>
                <img
                  className="h-24"
                  src="https://docs.walletconnect.com/img/walletconnect-logo.svg"
                  alt="wallet connect" />
              </figure>
              <div className="card-body">
                <h2 className="card-title">
                  <a className="link link-hover" href="https://walletconnect.org/" target="_blank" rel="noreferrer">
                    Wallet Connect
                  </a>
                </h2>
                <p>Open protocol for connecting Wallets to Dapps</p>
                <div className="justify-end card-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={disabled}
                    onClick={() => {
                      setActivatingConnector(walletconnect);
                      activate(walletconnect);
                    }}
                  >
                    <div className="px-2 py-4">
                      {activating(walletconnect) && <p className="btn loading">loading...</p>}
                      {connected(walletconnect) && (
                        <span role="img" aria-label="check">
                          ✅
                        </span>
                      )}
                    </div>
                    Connect with WalletConnect
                  </button>
                  {(active || error) && connected(walletconnect) && (
                    <>
                      {!!(library && account) && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => {
                            library
                              .getSigner(account)
                              .signMessage("👋")
                              .then((signature: any) => {
                                window.alert(`Success!\n\n${signature}`);
                              })
                              .catch((err: Error) => {
                                window.alert(`Failure!${err && err.message ? `\n\n${err.message}` : ""}`);
                              });
                          }}
                        >
                          Sign Message
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          if (connected(walletconnect)) {
                            (connector as any).close();
                          }
                          deactivate();
                        }}
                      >
                        Deactivate
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>}
          <div>
            <h4>Account: {account}</h4>
            {loot !== undefined &&
              <p>{JSON.stringify(loot)}</p>}
            <Character avatar={loot} open={account && active} />
          </div>
      </>
    </div>
  );
};

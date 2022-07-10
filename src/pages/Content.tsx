import Character from "../components/Character";
import React, { useEffect, useState } from "react";

import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";

import { injected, walletconnect } from "../dapp/connectors";
import { useEagerConnect, useInactiveListener } from "../dapp/hooks";

import { synthLootAddress, synthLootAbi, lootAddress, moreLootAddress, lootAbi } from '../contract';
import { ethers } from "ethers";
import dynamic from "next/dynamic";

const Content = () => {
  const context = useWeb3React<Web3Provider>();
  const { connector, library, account, activate, deactivate, active, error } = context;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);


  const [syntheticLoot, setSyntheticLoot] = useState(null);
  const [lootTokenIds, setLootTokenIds] = useState(null);
  const [mLootTokenIds, setmLootTokenIds] = useState(null);

  useEffect(() => {
    if (!account || !active) return;
    const signer = library.getSigner();

    const synthContract = new ethers.Contract(
      synthLootAddress,
      synthLootAbi,
      signer
    );
    (async () => {

      const [chest, foot, hand, head, neck, ring, waist, weapon] =
      await Promise.all([
        synthContract.getChest(account),
        synthContract.getFoot(account),
        synthContract.getHand(account),
        synthContract.getHead(account),
        synthContract.getNeck(account),
        synthContract.getRing(account),
        synthContract.getWaist(account),
        synthContract.getWeapon(account),
      ]);

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
      setSyntheticLoot(loot);
    })();

    (async () => {
      // get chests from loot and mLoot
      const loot = new ethers.Contract(lootAddress, lootAbi, signer);
      
      const mLoot = new ethers.Contract(moreLootAddress, lootAbi, signer);

      const testAccount = '0xF296178d553C8Ec21A2fBD2c5dDa8CA9ac905A00';

      const lootAccount = account; // testAccount;

      const [balance, mBalance] = await Promise.all([
        loot.balanceOf(lootAccount),
        mLoot.balanceOf(lootAccount),
      ]);
      
      // convert balance to from a BigNumber to a number
      const lootBalance = balance.toNumber();
      const mLootBalance = mBalance.toNumber();

      console.log('balance is', lootBalance);
      console.log('mBalance is', mLootBalance);

      const lootTokens = [];

      if(lootBalance > 0){
        console.log("This account has loot!");
        // iterate from 0 to lootBalance
        // for i, call loot.tokenOfOwnerByIndex(lootAccount, i)
        for (let i = 0; i < lootBalance; i++) {
          const token = await loot.tokenOfOwnerByIndex(lootAccount, i);
          lootTokens.push(token);
          console.log('loot token is', token);
        }
      }
      const mLootTokens = [];

      // do the same for mLoot
      if(mLootBalance > 0){
        console.log("This account has mLoot!");
        // iterate from 0 to mLootBalance
        // for i, call mLoot.tokenOfOwnerByIndex(lootAccount, i)
        for (let i = 0; i < mLootBalance; i++) {
          const token = await mLoot.tokenOfOwnerByIndex(lootAccount, i);
          mLootTokens.push(token);
          console.log('mLoot token is', token);
        }
      }

      setLootTokenIds(lootTokens);
      setmLootTokenIds(mLootTokens);

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
            {syntheticLoot !== undefined &&
              <p>{JSON.stringify(syntheticLoot)}</p>}
            <Character avatar={syntheticLoot} lootTokens={lootTokenIds} mLootTokens={mLootTokenIds} open={account && active} />
          </div>
      </>
    </div>
  );
};

export default dynamic(() => Promise.resolve(Content), {
  ssr: false,
});
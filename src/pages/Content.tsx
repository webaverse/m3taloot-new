import React, { useEffect, useState, useContext } from "react";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers } from "ethers";
import dynamic from "next/dynamic";
import Web3Modal from "web3modal";

import { synthLootAddress, synthLootAbi, lootAddress, moreLootAddress, hyperLootAddress, genesisAdventurerAddress, lootAbi } from '../contract';
import styles from './Content.module.css';
import World from "./World";
import { AppContext } from "./index";

const INFURA_ID = "460f40a260564ac4a4f4b3fffb032dad";

const Content = () => {
  useEffect(()=>{
    import("bootstrap/dist/js/bootstrap");
  },[]);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  const [syntheticLoot, setSyntheticLoot] = useState(null);
  const [lootTokens, setLootTokens] = useState(null);
  const [mLootTokens, setmLootTokens] = useState(null);
  const [hyperLootTokens, setHyperLootTokens] = useState([]);
  const [genesisAdventurer, setGenesisAdventurer] = useState([]);

  const { state, account, setAccount, library, setLibrary, provider, setProvider} = useContext(AppContext);

  useEffect(() => {
    if (!account) return;
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

      const hyperLoot = new ethers.Contract(hyperLootAddress, lootAbi, signer);

      const genesisAdventurerContract = new ethers.Contract(genesisAdventurerAddress, lootAbi, signer);


      const testAccount = '0xF296178d553C8Ec21A2fBD2c5dDa8CA9ac905A00';

      const lootAccount = account; // testAccount;

      const [balance, mBalance, hyperLootBalanceB, genesisAdventurerBalanceB] = await Promise.all([
        loot.balanceOf(lootAccount),
        mLoot.balanceOf(lootAccount),
        hyperLoot.balanceOf(lootAccount),
        genesisAdventurerContract.balanceOf(lootAccount)
      ]);
      
      // convert balance to from a BigNumber to a number
      const lootBalance = balance.toNumber();
      const mLootBalance = mBalance.toNumber();
      const hyperLootBalance = hyperLootBalanceB.toNumber();
      const genesisAdventurerBalance = genesisAdventurerBalanceB.toNumber();

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
        // now traverse the scene and
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
      const hyperLootTokens = [];
      // do the same for mLoot
      if(hyperLootBalance > 0){
        console.log("This account has mLoot!");
        // iterate from 0 to mLootBalance
        // for i, call mLoot.tokenOfOwnerByIndex(lootAccount, i)
        for (let i = 0; i < hyperLootBalance; i++) {
          const token = await mLoot.tokenOfOwnerByIndex(lootAccount, i);
          hyperLootTokens.push(token);
          console.log('hyperLootTokens token is', token);
        }
      }

      const genesisAdventurer = [];
      if(genesisAdventurerBalance > 0){
        console.log("This account has mLoot!");
        // iterate from 0 to mLootBalance
        // for i, call mLoot.tokenOfOwnerByIndex(lootAccount, i)
        for (let i = 0; i < genesisAdventurerBalance; i++) {
          const token = await mLoot.tokenOfOwnerByIndex(lootAccount, i);
          genesisAdventurer.push(token);
          console.log('genesisAdventurer token is', token);
        }
      }

      setLootTokens(lootTokens);
      setmLootTokens(mLootTokens);
      setHyperLootTokens(mLootTokens);
      setGenesisAdventurer(genesisAdventurer);
    })();


  }, [account]);

  // // handle logic to recognize the connector currently being activated
  // const [activatingConnector, setActivatingConnector] = useState<any>();
  // useEffect(() => {
  //   if (activatingConnector && activatingConnector === connector) {
  //     setActivatingConnector(undefined);
  //   }
  // }, [activatingConnector, connector]);

  // handle logic to eagerly connect to the injected ethereum provider, if it exists and has granted access already
  // const triedEager = useEagerConnect();

  // // handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
  // useInactiveListener(!triedEager || !!activatingConnector);

  // const activating = (connection: typeof injected | typeof walletconnect) => connection === activatingConnector;
  // const connected = (connection: typeof injected | typeof walletconnect) => connection === connector;
  // const disabled = !triedEager || !!activatingConnector || connected(injected) || connected(walletconnect) || !!error;

  const web3Modal = new Web3Modal({
    network: "rinkeby",
    theme: "light", // optional, 'dark' / 'light',
    cacheProvider: false, // optional
    providerOptions: {
      walletconnect: {
        package: WalletConnectProvider, // required
        options: {
          infuraId: INFURA_ID, // required
        },
      }
    }, // required
  });

  const connectWallet = async () => {
    try {
      const web3Provider = await web3Modal.connect();
      const library = new ethers.providers.Web3Provider(web3Provider);
      const web3Accounts = await library.listAccounts();
      const network = await library.getNetwork();
      setAccount(web3Accounts[0]);
      setProvider(web3Provider);
      setLibrary(library)
    } catch (error) {
      console.log(error);
    }
  }

  const disConnectWallet = async () => {
    console.log("disconnect")
    await web3Modal.clearCachedProvider();
    if (provider?.disconnect && typeof provider.disconnect === 'function') {
        await provider.disconnect();
        setAccount(null);
        setProvider(null);
        setLibrary(null);
    }
  }
  
  // console.log(account, "account", active, "active");
  return (
      <>
        { !account && <div className={styles.walletModal}>
            <p className={styles.headerTitle}>Enter, Brave adventurers</p>
            <p className={styles.bodyTitle}>You will need to connect your wallet for this experience.</p>
            <div className={styles.connectBtn} >
              <p className={styles.connectTitle} onClick={connectWallet}>Connect wallet</p>
            </div>
          </div>
        }
        { account && <div className={styles.walletAddressSection}>
            <p className={styles.walletAddress}>{account.slice(0, 4) + `...` + account.slice(-5)}</p>
            <div className={styles.disconnectBtn} onClick={disConnectWallet}></div>
          </div>
        }
        <div style={{color:"white"}}>
          {/*{syntheticLoot !== undefined &&
            <p>{JSON.stringify(syntheticLoot)}</p>}*/}
          <World avatar={syntheticLoot} hyperLootTokens={hyperLootTokens} genesisAdventurerTokens={genesisAdventurer} lootTokens={lootTokens} mLootTokens={mLootTokens} open={account} />
        </div>
      </>
  );
};

export default dynamic(() => Promise.resolve(Content), {
  ssr: false,
});
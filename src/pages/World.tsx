import { PerspectiveCamera, PositionalAudio } from '@react-three/drei';
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import axios from "axios";
import { BigNumber, ethers } from "ethers";
import React, { Suspense, useEffect, useRef, useState, useContext } from "react";
import { AnimationMixer, Color, Group, MeshStandardMaterial } from "three";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";



import Avatar from '../components/Avatar';
import { sceneService } from "../components/scene";
import templates from "../data/base_models";
import modelTraits from "../data/model_traits";
import VRMExporter from "../library/VRMExporter";
import { cloneSkeleton, combine } from "../library/merge-geometry";
import { getAvatarData } from "../library/utils";
import { getModelFromScene, getScreenShot } from "../library/utils";
import styles from "./World.module.css";
import { AppContext } from "./index";


const pinataApiKey = process.env.VITE_PINATA_API_KEY;
const pinataSecretApiKey = process.env.VITE_PINATA_API_SECRET;

function CameraMod(scene) {
  const cameraDolly = scene.scene.cameras[0];

  const { camera } = useThree();

  useFrame(() => {
    camera.position.copy(cameraDolly.position);
    camera.rotation.copy(cameraDolly.rotation);
    camera.updateMatrixWorld();
  });
  return null;
}

const lootSlots = ["Loot1", "Loot2", "Loot3", "Loot4", "Loot5"];
const mLootSlots = ["mLoot1", "mLoot2", "mLoot3", "mLoot4", "mLoot5"];
const hyperLootSlots = ["Hyperloot1", "Hyperloot2", "Hyperloot3", "Hyperloot4", "Hyperloot5"];
const genesisAdventurerSlots = [
  "GenesisAdventurer1",
  "GenesisAdventurer2",
  "GenesisAdventurer3",
  "GenesisAdventurer4",
  "GenesisAdventurer5",
];

export default function World({ avatar, open, lootTokens, mLootTokens, hyperLootTokens, genesisAdventurerTokens }) {
  const scene = useRef();
  const standRoot = useRef();
  const avatarCamera = useRef();
  const [doors, setDoors] = useState<any>();
  const [stand, setStand] = useState<any>(); 
  const [totalAvatar, setTotalAvatar] = useState<any>(); 
  const [avatarModal, setAvatarModal] = useState<any>(false);
  const [successModal, setSuccessModal] = useState<any>(false);
  const [claimDisable, setClaimDisable] = useState<any>(false);
  const { state, account, setAccount, library, setLibrary, provider, setProvider } = useContext(AppContext);

  const templateInfo = templates[0];

  function fetchTrait(type: any, name: any) {
    console.log("name", type, name)
    // Sometimes the name can have a prefix with double-quotes like "Cataclysm Hero", we want to remove the prefix (including double-quotes) and the space after it
    let cleanedName = name.replace(/^"(.+)"\s/, "");
    // remove any +1 or +2 in the string
    cleanedName = cleanedName.replace(/\+\d/, "");
    // trim any whitespace from the name
    cleanedName = cleanedName.trim();
    // some traits contain 'of XXX' at the end, we should remove the word of and anything that comes after
    cleanedName = cleanedName.replace(/\s+of\s+.*/, "");
    // console.log("final name is: " + cleanedName);

    // find the trait inside the collection array inside modelTraits
    const category = modelTraits.filter((trait: any) => trait.trait === type)[0];
    const trait = category.collection.filter((trait: any) => trait.name === cleanedName)[0];  // fixed this
    // const trait = category.collection[0];

    if (trait) return trait;

    // maybe not in chest, because we have a body differentiation
    if (type === "chest") {
      console.log("handling chest");
      const category = modelTraits.filter((trait: any) => trait.trait === "body")[0];
      const trait = category.collection.filter((trait: any) => trait.name === cleanedName)[0];
      return trait;
    }

    // maybe not in foot, because we have a body differentiation
    if (type === "foot") {
      console.log("handling foot");
      let category = modelTraits.filter((trait: any) => trait.trait === "legs")[0];
      let trait = category.collection.filter((trait: any) => trait.name === cleanedName)[0];
      // if trait is null then slice name down to first two words and try again
      if (!trait) {
        let newName = cleanedName.split(" ");
        newName = newName[0] + " " + newName[1];
        category = modelTraits.filter((trait: any) => trait.trait === "foot")[0];
        trait = category.collection.filter((trait: any) => {
          return trait.name.includes(newName);
        })[0];
      }

      return trait;
    }
  }

  async function saveFileToPinata(fileData, fileName) {
    console.log("pinataApiKey", pinataApiKey);
    console.log("pinataSecretApiKey", pinataSecretApiKey);
    if (!fileData) return console.warn("Error saving to pinata: No file data");
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    let data = new FormData();

    data.append("file", fileData, fileName);
    let resultOfUpload = await axios.post(url, data, {
      maxContentLength: "Infinity", //this is needed to prevent axios from erroring out with large files
      maxBodyLength: "Infinity", //this is needed to prevent axios from erroring out with large files
      headers: {
        "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
    });
    return resultOfUpload.data;
  }

  function setSlots(tokens, tokenSlots) {
    console.log("setting slots", tokens, tokenSlots);
    // traverse the scene and find all objects with a name contained in the tokenSlots array
    let objects = [];
    // traverse the scene and find all objects with a name contained in the tokenSlots array
    // use the Object3D.traverse method to find all objects with a name contained in the tokenSlots array
    scene.current.traverse((object: any) => {
      if (tokenSlots.includes(object.name)) {
        // set the object's material to the token's color
        objects.push(object);
        object.visible = false;
      }
    });

    // for each token, show one object in the array
    if (objects.length > 0) {
      for (let i = 0; i < tokens.length; i++) {
        objects[i].visible = true;
      }
    }
  }

  useEffect(() => {
    // load doors.glb using GLTFLoader
    const loader = new GLTFLoader();
    loader.load("./world.glb", (gltf) => {
      setDoors(gltf);
      gltf.scene.position.set(0, 0, 0);
      // add doors to scene
      (scene as any).current.add(gltf.scene);

      (scene as any).current.traverse((object: any) => {
        if (object.name.includes("Stand")) {
          // set the object's material to the token's color
          setStand(object);

          // start an interval that checks if standRoot.current is null and cancels when it isn't
          const interval = setInterval(() => {
            if (standRoot.current) {
              clearInterval(interval);
              (standRoot as any).current.position.copy(object.position);
              (standRoot as any).current.rotation.copy(object.rotation);
              (standRoot as any).current.updateMatrixWorld();
            }
          });
        }
      });
    });
  }, []);

  useEffect(() => {
    if (!lootTokens || !mLootTokens || !hyperLootTokens || !genesisAdventurerTokens) return;
    setSlots(lootTokens, lootSlots);
    setSlots(mLootTokens, mLootSlots);
    setSlots(hyperLootTokens, hyperLootSlots);
    setSlots(genesisAdventurerTokens, genesisAdventurerSlots);
  }, [lootTokens, mLootTokens, hyperLootTokens, genesisAdventurerTokens]);

  useEffect(() => {
    if (open && doors) {
      console.log("opening doors", doors);
      // if the doors are not open, open them
      // play the open animation on the doors
      // first, get the animation reference from doors.scene
      // play the animation clip
      const mixer = new AnimationMixer(doors.scene);

      // for each animation in doors.animations, play the clip action in mixer
      doors.animations.forEach((animation: any) => {
        mixer.clipAction(animation).play();
      });

      const interval = setInterval(() => {
        if (mixer.time >= doors.animations[0].duration - 1 / 30) {
          // cancel interval
          clearInterval(interval);
          return;
        } else {
          mixer.update(1 / 30);
        }
      }, 1000 / 30);
    }
  }, [open, doors]);

  useEffect(() => {
    if (avatar && scene) {
      sceneService.setTraits(avatar);

      const loader = new GLTFLoader();

      // for each key in avatar, log the value of the key
      for (const key in avatar) {
        const trait = fetchTrait(key, avatar[key]);
        if (trait) {
          loader
            .loadAsync(`${templateInfo.traitsDirectory}${trait?.directory}`, (e) => {
            })
            .then(async (gltf) => {
              if (key === "weapon") {
                gltf.scene.position.set(0.5, 1, 0.1);
              }
              if (key === "ring") {
                gltf.scene.position.set(-0.5, 1, 0.1);
              }
              (standRoot as any).current.add(gltf.scene);
              console.log("standRoot", standRoot)
            });
        } else {
          console.log("trait ignored", key);
        }
      }


    }
  }, [avatar]);

  const canvasWrap = {
    height: "100vh",
    width: "100vw",
    position: "absolute" as const,
    zIndex: "-100",
    top: "0",
    backgroundColor: "#000",
  };

  const showAvatarModal = () => {
    setAvatarModal(true);
  };

  const closeAvatarModal = () => {
    setAvatarModal(false);
    setSuccessModal(false);
  };

  const claimNFT = async () => {
    setSuccessModal(true);
    setClaimDisable(true);
    // const screenshot = await getScreenShot("mint-scene")
    // if (!screenshot) {
    //   throw new Error("Unable to get screenshot")
    // }

    // const imageHash = await saveFileToPinata(
    //   screenshot,
    //   "AvatarImage_" + Date.now() + ".png",
    // ).catch((reason) => {
    //   console.error(reason)
    //   // setMintStatus("Couldn't save to pinata")
    // })
    // const glb = await getModelFromScene(avatar.scene.clone(), "glb", new Color(1, 1, 1))
    // const glbHash = await saveFileToPinata(
    //   glb,
    //   "AvatarGlb_" + Date.now() + ".glb",
    // )

    // let attributes = [];
    // Object.keys(avatar).map((trait: any) => {
    //   attributes.push({
    //     trait_type: trait,
    //     value: avatar[trait]
    //   })
    // })
    // console.log("attributes", attributes)
    // const metadata = {
    //   name: "Avatars",
    //   description: "Creator Studio Avatars.",
    //   image: `ipfs://${imageHash.IpfsHash}`,
    //   animation_url: `ipfs://${glbHash.IpfsHash}`,
    //   attributes,
    // }
    // const str = JSON.stringify(metadata)
    // const metaDataHash = await saveFileToPinata(
    //   new Blob([str]),
    //   "AvatarMetadata_" + Date.now() + ".json",
    // )
    // const metadataIpfs = metaDataHash.IpfsHash

    // ////////////////////// mint /////////////////////
    // const chainId = 5 // 1: ethereum mainnet, 4: rinkeby 137: polygon mainnet 5: // Goerli testnet
    // if (window.ethereum.networkVersion !== chainId) {
    //   try {
    //     await window.ethereum.request({
    //       method: "wallet_switchEthereumChain",
    //       params: [{ chainId: "0x5" }], // 0x4 is rinkeby. Ox1 is ethereum mainnet. 0x89 polygon mainnet  0x5: // Goerli testnet
    //     })
    //   } catch (err) {
    //     // notifymessage("Please check the Ethereum mainnet", "error");
    //     // setMintStatus("Please check the Polygon mainnet")
    //     return false
    //   }
    // }
    // const signer = new ethers.providers.Web3Provider(
    //   window.ethereum,
    // ).getSigner()
    // const contract = new ethers.Contract(CharacterContract.address, CharacterContract.abi, signer)
    // const tokenPrice = await contract.tokenPrice()
    // try {
    //   const options = {
    //     value: BigNumber.from(tokenPrice).mul(1),
    //     from: account,
    //   }
    //   const tx = await contract.mintToken(1, metadataIpfs, options)
    //   let res = await tx.wait()
    //   if (res.transactionHash) {
    //     // setMintStatus("Mint success!")
    //     // setCurrentView(ViewStates.MINT_COMPLETE)
    //   }
    // } catch (err) {
    //   // setMintStatus("Public Mint failed! Please check your wallet.")
    // }
    /////////////////////////////////////////////////
  }

  async function download(avatarToDownload, fileName, format, atlasSize = 4096, isUnoptimized = false) {
    // We can use the SaveAs() from file-saver, but as I reviewed a few solutions for saving files,
    // this approach is more cross browser/version tested then the other solutions and doesn't require a plugin.
    const link = document.createElement("a");
    link.style.display = "none";
    document.body.appendChild(link);
    function save(blob, filename) {
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    }

    function saveString(text, filename) {
      save(new Blob([text], { type: "text/plain" }), filename);
    }

    function saveArrayBuffer(buffer, filename) {
      save(getArrayBuffer(buffer), filename);
    }
    // Specifying the name of the downloadable model
    const downloadFileName = `${fileName && fileName !== "" ? fileName : "AvatarCreatorModel"}`;

    console.log("avatarToDownload", avatarToDownload);

    const avatarToDownloadClone = avatarToDownload.clone();
    /*
      NOTE: After avatar clone, the origIndexBuffer/BufferAttribute in userData will lost many infos:
      From: BufferAttribute {isBufferAttribute: true, name: '', array: Uint32Array(21438), itemSize: 1, count: 21438, …}
      To:   Object          {itemSize: 1, type: 'Uint32Array',  array: Array(21438), normalized: false}
      Especailly notics the change of `array` type, and lost of `count` property, will cause errors later.
      So have to reassign `userData.origIndexBuffer` after avatar clone.
    */
    const origIndexBuffers = [];
    avatarToDownload.traverse((child) => {
      if (child.userData.origIndexBuffer) origIndexBuffers.push(child.userData.origIndexBuffer);
    });
    avatarToDownloadClone.traverse((child) => {
      if (child.userData.origIndexBuffer) child.userData.origIndexBuffer = origIndexBuffers.shift();
    });

    let avatarModel;

    const exporter = format === "glb" ? new GLTFExporter() : new VRMExporter();
    if (isUnoptimized) {
      let skeleton;
      const skinnedMeshes = [];

      avatarToDownloadClone.traverse((child) => {
        if (!skeleton && child.isSkinnedMesh) {
          skeleton = cloneSkeleton(child);
        }
        if (child.isSkinnedMesh) {
          child.geometry = child.geometry.clone();
          child.skeleton = skeleton;
          skinnedMeshes.push(child);
          if (Array.isArray(child.material)) {
            const materials = child.material;
            child.material = new MeshStandardMaterial();
            child.material.map = materials[0].map;
          }
          if (child.userData.origIndexBuffer) {
            child.geometry.setIndex(child.userData.origIndexBuffer);
          }
        }
      });

      avatarModel = new Group();
      skinnedMeshes.forEach((skinnedMesh) => {
        avatarModel.add(skinnedMesh);
      });
      avatarModel.add(skeleton.bones[0]);
    } else {
      avatarModel = await combine({
        transparentColor: new Color(1, 1, 1),
        avatar: avatarToDownloadClone,
        atlasSize,
      });
    }
    if (format === "glb") {
      exporter.parse(
        avatarModel,
        (result) => {
          if (result instanceof ArrayBuffer) {
            saveArrayBuffer(result, `${downloadFileName}.glb`);
          } else {
            const output = JSON.stringify(result, null, 2);
            saveString(output, `${downloadFileName}.gltf`);
          }
        },
        (error) => {
          console.error("Error parsing", error);
        },
        {
          trs: false,
          onlyVisible: false,
          truncateDrawRange: true,
          binary: true,
          forcePowerOfTwoTextures: false,
          maxTextureSize: 1024 || Infinity,
        }
      );
    } else {
      const vrmData = { ...getVRMBaseData(avatar), ...getAvatarData(avatarModel, "UpstreetAvatar") };
      exporter.parse(vrmData, avatarModel, (vrm) => {
        saveArrayBuffer(vrm, `${downloadFileName}.vrm`);
      });
    }
  }

  function getVRMBaseData(avatar) {
    // to do, merge data from all vrms, not to get only the first one
    for (const prop in avatar) {
      if (avatar[prop].vrm) {
        return avatar[prop].vrm;
      }
    }
  }

  function getArrayBuffer(buffer) {
    return new Blob([buffer], { type: "application/octet-stream" });
  }

  return (
    <Suspense fallback="loading...">
      {templateInfo && (
        <div id="canvas-wrap" style={{ ...canvasWrap }}>
          <Canvas className="canvas" id="editor-scene" gl={{ preserveDrawingBuffer: true }}>
            <mesh ref={scene} position={[0, 0.02, 0]}>
              {/* add a group to the react-three/fiber scene */}
              <group ref={standRoot} onClick={showAvatarModal} />
            </mesh>
            {doors && scene.current && <CameraMod scene={doors} />}
          </Canvas>
        </div>
      )}
      {avatarModal && (
        <div className={styles.avatarModal}>
          <p className={styles.closeBtn} onClick={closeAvatarModal}>
            x
          </p>
          {
            !successModal ? (
              <>
                <p className={styles.headerTitle}>Your loot</p>
                <div className={styles.bodySection}>
                  <div className={styles.bodyTitle}>
                    {Object.keys(avatar).map((trait: any) => {
                      return (
                        <p className={styles.traitName} key={trait}>
                          {trait}: &nbsp;&nbsp;{avatar[trait]}
                        </p>
                      );
                    })}
                  </div>
                  <div className={styles.avatarSection}>
                    <Canvas className={styles.mintCanvas} id="mint-scene" gl={{ antialias: true, preserveDrawingBuffer:true }} linear={false}>
                      <ambientLight
                        color={[1,1,1]}
                        intensity={0.5}
                      />
                      
                      <PerspectiveCamera ref={avatarCamera}>
                        <mesh scale={2} >
                          <Avatar avatar={avatar} stand={stand} fetchTrait={fetchTrait} templateInfo={templateInfo} setTotalAvatar={setTotalAvatar}/>
                        </mesh>
                      </PerspectiveCamera>
                    </Canvas>
                  </div>
                </div>
                <div className={styles.btnSection}>
                  { claimDisable ? <div className={styles.disabledClaimBtn}>
                          <p className={styles.claimTitle}>
                            Claim
                          </p>
                        </div> 
                        : <div className={styles.claimBtn}>
                            <p className={styles.claimTitle} onClick={() => {
                              claimNFT();
                            }}>
                              Claim
                            </p>
                          </div>
                  }
                  <div className={styles.downloadBtn}>
                    <p className={styles.downloadTitle} onClick={() => {
                      console.log("childatavar", totalAvatar);
                      download(totalAvatar, "m3LootAvatar", "glb")
                    }}>
                      Download glb
                    </p>
                  </div>
                </div>
              </>) :
              (
                <>
                  <p className={styles.successHeaderTitle}>Congratulations</p>
                  <p className={styles.successBodyTitle}>You claimed your adventurer gear</p>
                  <div className={styles.successBodySection}>
                    <div className={styles.successAvatarSection}>
                      <Canvas className={styles.successCanvas} id="mint-scene" gl={{ antialias: true, preserveDrawingBuffer:true }} linear={false}>
                        <ambientLight
                          color={[1,1,1]}
                          intensity={0.5}
                        />
                        
                        <PerspectiveCamera ref={avatarCamera}>                        
                          <mesh scale={2} >
                            <Avatar avatar={avatar} stand={stand} fetchTrait={fetchTrait} templateInfo={templateInfo} setTotalAvatar={() => {}}/>
                          </mesh>
                        </PerspectiveCamera>
                      </Canvas>
                    </div>
                  </div>
                  <p className={styles.successBodyTitle}>Join the community</p>
                  <div className={styles.successBtnSection}>
                    <div className={styles.discordBtn} onClick={() => {
                        // connect discord
                      }}>
                    </div>
                    <div className={styles.twitterBtn} onClick={() => {
                        // connect twitter
                      }}>
                    </div>
                  </div>
                </>
              )
          }
        </div>
      )}
    </Suspense>
  );
}
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { AnimationMixer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";



import { sceneService } from "../components/scene";
import templates from "../data/base_models";
import modelTraits from "../data/model_traits";
import styles from "./World.module.css";


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
  const standRootCopy = useRef();
  const [doors, setDoors] = useState<any>();
  const [stand, setStand] = useState<any>();
  const [avatarModal, setAvatarModal] = useState<any>(false);

  const templateInfo = templates[0];

  function fetchTrait(type: any, name: any) {
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
    const trait = category.collection.filter((trait: any) => trait.name === cleanedName)[0];

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
  };

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
              <Canvas className={styles.mintCanvas} id="editor-scene" gl={{ antialias: true, preserveDrawingBuffer:true }} linear={false}>
                <ambientLight
                  color={[1,1,1]}
                  intensity={0.5}
                />
              {/* create a cube and add it to the scene */}
              <mesh

                position={[0, 0.02, 0]}
                onClick={showAvatarModal}
              >
                {/* if scene is not null, show it */}
                {scene.current && <primitive object={(standRoot as any).current?.clone() ?? null} />}
              </mesh>
                
              </Canvas>
            </div>
          </div>
          <div className={styles.btnSection}>
            <div className={styles.claimBtn}>
              <p className={styles.claimTitle} onClick={() => {}}>
                Claim
              </p>
            </div>
            <div className={styles.downloadBtn}>
              <p className={styles.downloadTitle} onClick={() => {}}>
                Download glb
              </p>
            </div>
          </div>
          {/* <div className={styles.connectBtn} >
            <p className={styles.connectTitle} onClick={connectWallet}>Connect wallet</p>
          </div> */}
        </div>
      )}
    </Suspense>
  );
}
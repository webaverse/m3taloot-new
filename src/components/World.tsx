import modelTraits from '../data/model_traits';
import React, {
  Suspense,
  useEffect,
  useRef,
  useState
  } from 'react';
import templates from '../data/base_models';
import { AnimationMixer } from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { sceneService } from './scene';


function CameraMod(scene) {
  console.log("scene is", scene)
  // traverse the scene and find the camera
  const cameraDolly = scene.scene.cameras[0];

  console.log("cameraDolly", cameraDolly);

  const { camera } = useThree();

  useFrame(() => {
    camera.position.copy(cameraDolly.position);
    camera.rotation.copy(cameraDolly.rotation);
    camera.updateMatrixWorld();
  });
  return null
}

const lootSlots = ['Loot1', 'Loot2', 'Loot3', 'Loot4', 'Loot5'];
const mLootSlots = ['mLoot1', 'mLoot2', 'mLoot3', 'mLoot4', 'mLoot5'];
const hyperLootSlots = ['Hyperloot1', 'Hyperloot2', 'Hyperloot3', 'Hyperloot4', 'Hyperloot5'];
const genesisAdventurerSlots = ['GenesisAdventurer1', 'GenesisAdventurer2', 'GenesisAdventurer3', 'GenesisAdventurer4', 'GenesisAdventurer5'];

export default function World({ avatar, open, lootTokens, mLootTokens, hyperLootTokens, genesisAdventurerTokens }) {

  const scene = useRef();
  const standRoot = useRef();
  const [doors, setDoors] = useState<any>();
  const [stand, setStand] = useState<any>();


  const templateInfo = templates[0];

  function fetchTrait(type: any, name: any) {
    // Sometimes the name can have a prefix with double-quotes like "Cataclysm Hero", we want to remove the prefix (including double-quotes) and the space after it
    let cleanedName = name.replace(/^"(.+)"\s/, "");
    console.log("name is", name);
    console.log("cleanedName is: " + cleanedName);
    // remove any +1 or +2 in the string
    cleanedName = cleanedName.replace(/\+\d/, "");
    // trim any whitespace from the name
    cleanedName = cleanedName.trim();
    // some traits contain 'of XXX' at the end, we should remove the word of and anything that comes after
    cleanedName = cleanedName.replace(/\s+of\s+.*/, "");
    console.log("final name is: " + cleanedName);

    // find the trait inside the collection array inside modelTraits
    const category = modelTraits.filter((trait: any) => trait.trait === type)[0];
    const trait = category.collection.filter((trait: any) => trait.name === cleanedName)[0];

    if (trait) return trait;

    // maybe not in chest, because we have a body differentiation
    if (type === 'chest') {
      console.log('handling chest');
      const category = modelTraits.filter((trait: any) => trait.trait === 'body')[0];
      const trait = category.collection.filter((trait: any) => trait.name === cleanedName)[0];
      return trait;
    }

    // maybe not in foot, because we have a body differentiation
    if (type === 'foot') {
      console.log('handling foot');
      let category = modelTraits.filter((trait: any) => trait.trait === 'legs')[0];
      let trait = category.collection.filter((trait: any) => trait.name === cleanedName)[0];
      // if trait is null then slice name down to first two words and try again
      if (!trait) {
        let newName = cleanedName.split(' ');
        newName = newName[0] + ' ' + newName[1]
        category = modelTraits.filter((trait: any) => trait.trait === 'foot')[0];
        trait = category.collection.filter((trait: any) => { return trait.name.includes(newName) })[0];
      }

      return trait;
    }

  }

  function setSlots(tokens, tokenSlots) {
    console.log('setting slots', tokens, tokenSlots);
    // traverse the scene and find all objects with a name contained in the tokenSlots array
    let objects = [];
    // traverse the scene and find all objects with a name contained in the tokenSlots array
    // use the Object3D.traverse method to find all objects with a name contained in the tokenSlots array
    scene.current.traverse((object: any) => {
      if (tokenSlots.includes(object.name)) {
        console.log('found object', object.name);
        // set the object's material to the token's color
        objects.push(object);
        object.visible = false;
      }
      });

    console.log("objects are", objects);
    // for each token, show one object in the array
    if(objects.length > 0){

      for (let i = 0; i < tokens.length; i++) {
        objects[i].visible = true;
      }
    }
  }

  useEffect(() => {
    if(!lootTokens || !mLootTokens ||  !hyperLootTokens || !genesisAdventurerTokens) return;
    // load doors.glb using GLTFLoader
    const loader = new GLTFLoader();
    loader.load(
      './world.glb',
      (gltf) => {
        setDoors(gltf);
        gltf.scene.position.set(0, 0, 0);
        // add doors to scene
        (scene as any).current.add(gltf.scene)

        scene.current.traverse((object: any) => {
          if (object.name.includes('Stand')) {
            console.log('found stand', object.name);
            // set the object's material to the token's color
            setStand(object);

            // start an interval that checks if standRoot.current is null and cancels when it isn't
            const interval = setInterval(() => {
              if (standRoot.current) {
                clearInterval(interval);
                standRoot.current.position.copy(object.position);
                standRoot.current.rotation.copy(object.rotation);
                standRoot.current.updateMatrixWorld();
              }
            });
          }
        });

        setSlots(lootTokens, lootSlots);
        setSlots(mLootTokens, mLootSlots);
        setSlots(hyperLootTokens, hyperLootSlots);
        setSlots(genesisAdventurerTokens, genesisAdventurerSlots);
      }
    );
        setSlots(mLootTokens, mLootSlots);
      }, [lootTokens, mLootTokens, hyperLootTokens, genesisAdventurerTokens])

  useEffect(() => {
    if (open && doors) {
      console.log("opening doors", doors)
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
        if (mixer.time >= doors.animations[0].duration - (1 / 30)) {
          // cancel interval
          clearInterval(interval);
          return;
        } else {
          mixer.update(1 / 30);
        }
      }, 1000 / 30)
    }
  }, [open, doors])

  useEffect(() => {
    if (avatar && scene) {
      sceneService.setTraits(avatar);

      console.log("avatar is, ", avatar);
      console.log(fetchTrait('chest', avatar.chest));
      console.log("scene is", scene)
      const loader = new GLTFLoader()

      // for each key in avatar, log the value of the key
      for (const key in avatar) {
        const trait = fetchTrait(key, avatar[key]);
        console.log(`loading ${templateInfo.traitsDirectory}${trait?.directory}`)
        if (trait) {
          loader
            .loadAsync(
              `${templateInfo.traitsDirectory}${trait?.directory}`,
              (e) => {
                // console.log((e.loaded * 100) / e.total);
              },
            )
            .then(async (gltf) => {
              console.log(key, avatar[key]);
              if (key === 'weapon') {
                gltf.scene.position.set(.5, 1, .1)
              }
              if (key === 'ring') {
                gltf.scene.position.set(-.5, 1, .1)
              }
              (standRoot as any).current.add(gltf.scene)
            })
        } else {
          console.log("trait ignored", key)
        }
      }
    }
  }, [avatar])

  const canvasWrap = {
    height: "100vh",
    width: "100vw",
    position: "absolute" as const,
    zIndex: "-100",
    top: "0",
    backgroundColor: "#000"
  }

  return (
    <Suspense fallback="loading...">
      {templateInfo && (
        <div
          id="canvas-wrap"
          style={{ ...canvasWrap }}
        >
          <Canvas
            className="canvas"
            id="editor-scene"
            gl={{ preserveDrawingBuffer: true }}
          >
            <mesh ref={scene} position={[0, 0.02, 0]} >
              {/* add a group to the react-three/fiber scene */}
              <group ref={standRoot} />
            </mesh>
            {doors && scene.current &&
              <CameraMod scene={doors} />
            }
          </Canvas>
        </div>
      )}
    </Suspense>
  )
}
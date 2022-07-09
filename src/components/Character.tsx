import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { AnimationMixer } from "three";
import { sceneService } from "./scene";
import templates from "../data/base_models";
import modelTraits from '../data/model_traits';
import * as THREE from 'three';

let al,light1,hallLight
   
const initLights = ( scene ) => {
  al = new THREE.AmbientLight( 0xffffff, 0.2 );
  scene.add( al )
  
  light1 = new THREE.SpotLight( new THREE.Color( 0xffddb9 ).convertSRGBToLinear(), 15 )
  light1.position.set( 3, 8, 0 );
  light1.target.position.copy( new THREE.Vector3( 1, 0, 1 ) );
  light1.angle = 20 * Math.PI / 180;
  light1.penumbra = 1
  light1.distance = 10;

  light1.castShadow = true
  light1.shadow.mapSize.width = 2048
  light1.shadow.mapSize.height = 2048
  light1.shadow.camera.near = 0.5
  light1.shadow.camera.far = 10
  scene.add( light1.target, light1 )

  // hallway
  hallLight = new THREE.PointLight( 0xff5a00, 10 );
  hallLight.distance = 30;
  hallLight.decay = 2;
  hallLight.castShadow = false;
  hallLight.position.set( 2, 10, -25 )

  //const hallLightHelper = new THREE.PointLightHelper( hallLight )
  scene.add( hallLight ); 
}

function CameraMod () {
  const { camera } = useThree();

// write a function to interplate -20 to 0 over 5 seconds
let t = 0;
  useFrame(() => {
    camera.position.y = 1.5;
    camera.position.z = 2;
    camera.fov = 30;
    camera.rotation.set(-.25, 0, 0);
    // t += 0.01;
    // camera.position.z = Math.sin(t) * 5;
    camera.updateMatrixWorld();
  });
  return null
}

export default function Character({ avatar, open }) {

  const scene = useRef();
  const [doors, setDoors] = useState<any>();
  const [world, setWorld] = useState<any>();

  const templateInfo = templates[0];

  function fetchTrait(type: any, name: any) {

    // find the trait inside the collection array inside modelTraits
    const category = modelTraits.filter((trait: any) => trait.trait === type)[0];
    const trait = category.collection.filter((trait: any) => trait.name === name)[0];

    if(trait) return trait;

    // maybe not in chest, because we have a body differentiation
    if(type === 'chest') {
        console.log('handling chest');
        const category = modelTraits.filter((trait: any) => trait.trait === 'body')[0];
        const trait = category.collection.filter((trait: any) => trait.name === name)[0];
        return trait;
    }

        // maybe not in foot, because we have a body differentiation
        if(type === 'foot') {
          console.log('handling foot');
          let category = modelTraits.filter((trait: any) => trait.trait === 'legs')[0];
          let trait = category.collection.filter((trait: any) => trait.name === name)[0];
          // if trait is null then slice name down to first two words and try again
          if(!trait) {
            let newName = name.split(' ');
            newName = newName[0] + ' ' + newName[1]
            category = modelTraits.filter((trait: any) => trait.trait === 'foot')[0];
            trait = category.collection.filter((trait: any) => { return trait.name.includes(newName) })[0];
          }

          return trait;
      }

  }


  useEffect(() => {
        // load doors.glb using GLTFLoader
        const loader = new GLTFLoader();
        loader.load(
          './doors.glb',
          (gltf) => {
            setDoors(gltf);
            gltf.scene.position.set(0, .25, 1);
            // add doors to scene
            (scene as any).current.add(gltf.scene)
          }
        );
        loader.load(
          './world.glb',
          (gltf) => {
            setWorld(gltf);
            gltf.scene.position.set(0, -2, 0);
            // add doors to scene
            (scene as any).current.add(gltf.scene)
            initLights(scene.current);

          }
        );
  }, [])

  useEffect(() => {
    if (open && doors) {
      console.log("opening doors", doors)
      // if the doors are not open, open them
      // play the open animation on the doors
      // first, get the animation reference from doors.scene
      const animation = doors.animations[0];
      // play the animation clip
      const mixer = new AnimationMixer(doors.scene);

      mixer.clipAction(animation).play();

      const interval = setInterval (() => {
        if(mixer.time >= animation.duration - (1/30)) {
          // cancel interval
          clearInterval(interval);
          return;
        } else {
          mixer.update(1/30);
        }
      }, 1000/30)

      console.log("animation is", animation)
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
              (scene as any).current.add(gltf.scene)
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
              <spotLight
                // ref={ref}
                intensity={1}
                position={[0, 3.5, 2]}
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                castShadow
              />
              <mesh ref={scene} position={[0, 0.02, 0]} >
          
              </mesh>
              <CameraMod />
            </Canvas>
          </div>
      )}
    </Suspense>
  )
}
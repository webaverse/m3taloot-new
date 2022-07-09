import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { sceneService } from "./scene";
import templates from "../data/base_models";
import modelTraits from '../data/model_traits';

export default function Character({ avatar }) {
  const scene = useRef();

  const templateInfo = templates[0];

  function fetchTrait(type: any, name: any) {
    // find the trait inside the collection array inside modelTraits
    const category = modelTraits.filter((trait: any) => trait.trait === type)[0];
    const trait = category.collection.filter((trait: any) => trait.name === name)[0];

    return trait;
  }

  useEffect(() => {
    if(avatar && scene){
      sceneService.setTraits(avatar);

      console.log("avatar is, ", avatar);
      console.log(fetchTrait('chest', avatar.chest));
      console.log("scene is", scene)
      const loader = new GLTFLoader()

      // for each key in avatar, log the value of the key
      for (const key in avatar) {
        const trait = fetchTrait(key, avatar[key]);
        console.log("loading `${templateInfo.traitsDirectory}${trait?.directory}`")
      if(trait){
        loader
        .loadAsync(
          `${templateInfo.traitsDirectory}${trait?.directory}`,
          (e) => {
            // console.log((e.loaded * 100) / e.total);
          },
        )
        .then(async (gltf) => {
          console.log(key, avatar[key]);
          if(key === 'weapon'){
            gltf.scene.position.set(.5, 1, .1)
          }
          if(key === 'ring'){
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
    zIndex: "0",
    top: "0",
    backgroundColor: "#777"
  }

  return (
    <Suspense fallback="loading...">
        {templateInfo && (
  <div style={{
    width: "100vw",
    height: "100vh",
    position: "relative" as const
  }}>
    <div
      id="canvas-wrap"
      style={{ ...canvasWrap, height: window.innerHeight }}
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
        <OrbitControls
          minDistance={1}
          maxDistance={3}
          minPolarAngle={0.0}
          maxPolarAngle={Math.PI / 2 - 0.1}
          enablePan={true}
          target={[0, 1, 0]}
        />
        <PerspectiveCamera />
        <mesh ref={scene} position={[0, 0.02, 0]}>
          </mesh>
      </Canvas>
    </div>
  </div>
        )}
    </Suspense>
  )
}

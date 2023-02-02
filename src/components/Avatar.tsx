import { OrbitControls } from "@react-three/drei";
import React from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";


const Avatar = ({
  avatar,
  stand,
  fetchTrait,
  templateInfo,
  setTotalAvatar,
}: {
  avatar: any;
  stand: any;
  templateInfo: any;
  fetchTrait: (type: any, name: any) => any;
  setTotalAvatar: any
}) => {
  const groupAvatarRef = React.useRef() as any;
  React.useEffect(() => {
    if (avatar) {
      for (let i = 0; i < stand.children.length; i++) {
        if (stand.children[i].isSkinnedMesh === true) {
          const model = new THREE.Mesh(stand.children[i].geometry.clone(), stand.children[i].material.clone());
          const center = new THREE.Vector3();
          model.name = "body";
          model.geometry.computeBoundingBox();
          model.geometry.boundingBox.getCenter(center);
          model.geometry.center();
          model.position.copy(center);
          model.rotation.set(0, -0.87, 0);
          model.position.set(0, 0.715, 0.02);
          groupAvatarRef?.current?.add(model);
        }
      }
      const loader = new GLTFLoader();
      for (const key in avatar) {
        const trait = fetchTrait(key, avatar[key]);
        if (trait) {
          loader
            .loadAsync(`${templateInfo.traitsDirectory}${trait?.directory}`, (e) => {})
            .then(async (gltf) => {
              if (key === "weapon") {
                gltf.scene.position.set(0.6, 1.1, 0.05);
              }
              if (key === "ring") {
                gltf.scene.position.set(-0.5, 1, 0.1);
              }
              gltf.scene.name = "g-" + key;
              groupAvatarRef?.current?.add(gltf.scene);
              setTotalAvatar(groupAvatarRef.current);
            });
        } else {
          console.log("trait ignored", key);
        }
      }
    }
  }, [avatar]);
  return (
    <>
      <group ref={groupAvatarRef} position={[0, -0.72, 1]} />
      <pointLight color={0xff7a1a} intensity={0.5} position={[0, 7, 7]} />
      <OrbitControls />
    </>
  );
};

export default Avatar;
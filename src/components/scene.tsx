import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";

let scene = null;

let model = null;

const setModel = (newModel: any) => {
  model = newModel;
}

const setScene = (newScene: any) => {
  scene = newScene;
}

const getScene = () => scene;

let traits = {};

const setTraits = (newTraits: any) => {
  traits = newTraits;
}

const getTraits = () => traits;

async function getModelFromScene() {
    const exporter = new GLTFExporter()
    const options = {
      trs: false,
      onlyVisible: true,
      truncateDrawRange: true,
      binary: true,
      forcePowerOfTwoTextures: false,
      maxTextureSize: 1024 || Infinity
    }
    console.log("Scene is", scene);
    const glb: any = await new Promise((resolve) => exporter.parse(scene, resolve, (error) => console.error("Error getting model", error), options))
    return new Blob([glb], { type: 'model/gltf-binary' })
}

async function getObjectValue(target: any, scene: any, value: any) {
  if (target && scene) {
    const object = scene.getObjectByName(target);
    return object.material.color;
  }
}

async function getMesh(name: any, scene: any) {
  const object = scene.getObjectByName(name);
  return object;
}

async function setMaterialColor(scene: any, value: any, target: any) {
  if (scene && value) {
    const object = scene.getObjectByName(target);
    const randColor = value;
    const skinShade = new THREE.Color(
      `rgb(${randColor},${randColor},${randColor})`
    );
    object.material[0].color.set(skinShade);
  }
}

async function loadModel(file: any, type: any) {
  if (type && type === "glb" && file) {
    const loader = new GLTFLoader();
    return loader.loadAsync(file, (e) => {
      console.log(e.loaded)
    }).then((gltf) => {
      return gltf;
    });
  }

  if (type && type === "vrm" && file) {
    const loader = new GLTFLoader();
    return loader.loadAsync(file).then((model) => {
      return model;
    });
  }
}

async function updatePose(name: any, value: any, axis: any, scene: any) {
  const bone = scene.getObjectByName(name);
  if (bone instanceof THREE.Bone) {
    switch (axis) {
      case "x":
        bone.rotation.x = value;
        break;
      case "y":
        bone.rotation.y = value;
        break;
      case "z":
        bone.rotation.z = value;
        break;
      default:
    }
    return value;
  }
}

export const sceneService = {
  loadModel,
  updatePose,
  getMesh,
  setMaterialColor,
  getObjectValue,
  getModelFromScene,
  setScene,
  getScene,
  getTraits,
  setTraits,
  setModel
};
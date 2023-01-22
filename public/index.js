import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

("use strict");

$(function () {
  $("#prompt-form").on("submit", async () => {
    const prompt = $("#prompt").val();
    console.log(prompt);
    try {
      const res = await fetch("http://localhost:5000/api/object", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt }),
      });
      const json = await res.json();
    } catch (err) {}
  });

  function loadOBJ() {
    const width = $("#loader").innerWidth();
    const height = $("#loader").innerHeight();
    const [canvas] = $("#loader canvas");

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 10);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 2.5, 0);
    controls.update();

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.65);
    directionalLight.position.set(0, 10, 0);
    directionalLight.target.position.set(-5, 0, 0);
    scene.add(directionalLight);
    scene.add(directionalLight.target);

    const hemisphereLight = new THREE.HemisphereLight(0xb1e1ff, 0xb97a20, 0.65);
    scene.add(hemisphereLight);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      // alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    const mtlLoader = new MTLLoader();
    mtlLoader.setMaterialOptions({ invertTrProperty: true });
    mtlLoader.setPath("./assets/castle/");
    mtlLoader.load(
      "mesh.mtl",
      (materials) => {
        materials.preload();
        console.log(materials);
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath("./assets/castle/");
        objLoader.load(
          "mesh.obj",
          (object) => {
            object.scale.set(10, 10, 10);
            scene.add(object);
          },
          undefined,
          (err) => {
            console.log(err);
          }
        );
      },
      undefined,
      (err) => {
        console.log(err);
      }
    );
  }
  loadOBJ();
});

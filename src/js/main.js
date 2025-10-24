import '../css/style.css'
import * as THREE from "three";
import GUI from "lil-gui";
import { gsap } from "gsap";
import vertexSource from "./shader/vertexShader.glsl?raw";
import fragmentSource from "./shader/fragmentShader.glsl?raw";


import img01 from '../images/img_01.jpg';
import img02 from '../images/img_02.jpg';
import img03 from '../images/img_03.jpg';
import img04 from '../images/img_04.jpg';
import imgDisp1 from '../images/displacement.jpg';


let renderer, scene, camera, fovRadian, distance, geometry, mesh;

const canvas = document.querySelector("#canvas");

let size = {
  width: window.innerWidth,
  height: window.innerHeight
};

async function init(){

  // レンダラー
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(size.width, size.height);

  //シーン
  scene = new THREE.Scene();

  //カメラ
  //ウインドウとWebGL座標を一致させる
  const fov = 45;
  fovRadian = (fov / 2) * (Math.PI / 180); //視野角をラジアンに変換
  distance = (size.height / 2) / Math.tan(fovRadian); //ウインドウぴったりのカメラ距離
  camera = new THREE.PerspectiveCamera(fov, size.width / size.height, 1, distance * 2);
  camera.position.z = distance;
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  scene.add(camera);


  //ジオメトリ
  geometry = new THREE.PlaneGeometry(size.width, size.height, 40, 40);

  //テクスチャ
  const loader = new THREE.TextureLoader();
  
  // スライド用のテクスチャ配列
  const slideImages = [img01, img02, img03, img04];
  const slideTextures = [];
  for (let i = 0; i < slideImages.length; i++) {
    slideTextures.push(await loader.loadAsync(slideImages[i]));
  }
  
  // 後方互換性のためのエイリアス
  const texture01 = slideTextures[0];
  const texture02 = slideTextures[1];
  const texture03 = slideTextures[2];
  const texture04 = slideTextures[3];

  const textureDisp = await loader.loadAsync(imgDisp1);

  const textures = {
    displacement: textureDisp
  };
  const settings = {
    duration: 1.8,
    delay: 3.0,
    ease: 'expo.out',
    direction: '右から左',
    strength: 0.1,
    angle1: Math.PI / 4,
    angle2: -Math.PI / 4 * 3,
    intensity1: 0.2,
    intensity2: 0.2
  }
  const easeOptions = ['power2.inOut', 'power4.inOut', 'circ.inOut', 'expo.inOut', 'power2.out', 'power4.out', 'circ.out', 'expo.out', 'none'];

  const directionOptions = {
    '右から左': 0,
    '上から下': 1,
    '右上から左下': 2,
    '左下から右上': 3,
  };

  //GLSL用データ
  let uniforms = {
    uTime: {
      value: 0.0
    },
    uTexCurrent: {
      value: texture01
    },
    uTexNext: {
      value: texture02
    },
    uTexDisp: {
      value: textureDisp
    },
    uResolution: {
      value: new THREE.Vector2(size.width, size.height)
    },
    uTexResolution: {
      value: new THREE.Vector2(3, 2)
    },
    uProgress: {
      value: 0.0
    },
    uDirection: {
      value: directionOptions[settings.direction],
    },
    uStrength: {
      value: 1.0
    },
    dispFactor: { value: 0.0 },
    disp: { value: textureDisp },
    texture1: { value: texture01 },
    texture2: { value: texture02 },
    angle1: { value: settings.angle1 },
    angle2: { value: settings.angle2 },
    intensity1: { value: settings.intensity1 },
    intensity2: { value: settings.intensity2 },
    res: { value: new THREE.Vector4(size.width, size.height, 1.0, 1.0) },
  };

  //マテリアル
  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexSource,
    fragmentShader: fragmentSource,
    side: THREE.DoubleSide
  });

  //メッシュ
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);


  // lil-guiの設定
  const gui = new GUI();

  const textureFolder = gui.addFolder('変形テクスチャ');
  const textureUpload = document.getElementById('texture-upload');
  textureFolder.add({ upload: () => { textureUpload.click(); } }, 'upload').name('変形用画像をアップロートする');

  textureUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const dataUrl = e.target.result;
        loader.load(dataUrl, (texture) => {
          uniforms.uTexDisp.value = texture;
          textures.displacement = texture;
        });
      };
      reader.readAsDataURL(file);
    }
  });
  textureFolder.open();

  const gsapFolder = gui.addFolder('アニメーション設定');
  gsapFolder.add(settings, 'duration', 0.1, 3.0, 0.1).name('変化秒数').onChange((value) => {
    settings.duration = value;
    updateTimeline();
  });
  gsapFolder.add(settings, 'delay', 1.0, 8.0, 0.5).name('待機秒数').onChange((value) => {
    settings.delay = value;
    updateTimeline();
  });
  gsapFolder.add(settings, 'ease', easeOptions).name('イージング').onChange((value) => {
    settings.ease = value;
    updateTimeline();
  });
  gsapFolder.add(settings, 'direction', Object.keys(directionOptions)).name('変形方向').onChange((value) => {
    settings.direction = value;
    uniforms.uDirection.value = directionOptions[value];
    // updateTimeline();
  });
  gsapFolder.add(settings, 'strength', 0.01, 2.0, 0.01).name('変形強度').onChange((value) => {
    settings.strength = value;
    uniforms.uStrength.value = value;
  });
  gsapFolder.open();



  // 現在のスライドインデックス管理
  let currentSlideIndex = 0;
  
  // タイムライン設定
  let timeline = gsap.timeline({ repeat: -1 });


  function updateTimeline() {
    timeline.kill();
    timeline = gsap.timeline({ repeat: -1 });
    
    // スライドの枚数が1枚以下の場合は何もしない
    if (slideTextures.length <= 1) {
      return;
    }
    
    // 現在のインデックスをリセット
    currentSlideIndex = 0;
    
    // 動的にスライドの枚数に応じてタイムラインを生成
    for (let i = 0; i < slideTextures.length; i++) {
      const currentIndex = i;
      const nextIndex = (i + 1) % slideTextures.length;
      
      timeline.to(uniforms.dispFactor, {
        value: 1.0,
        duration: settings.duration,
        delay: settings.delay,
        ease: settings.ease,
        onComplete: () => {
          // 次のスライドに移動
          currentSlideIndex = nextIndex;
          uniforms.texture1.value = slideTextures[nextIndex];
          uniforms.texture2.value = slideTextures[(nextIndex + 1) % slideTextures.length];
          uniforms.dispFactor.value = 0.0;
        },
      });
    }
  }

  updateTimeline();


  function animate(){
    uniforms.uTime.value += 0.03;

    // mesh.geometry.verticesNeedUpdate = true;
    
    //レンダリング
    renderer.render(scene, camera);
    // controls.update();
    requestAnimationFrame(animate);
  }
  animate();
  
}

init();


//リサイズ
function onWindowResize() {
  size.width = window.innerWidth;
  size.height = window.innerHeight;
  // レンダラーのサイズを修正
  renderer.setSize(size.width, size.height);
  // カメラのアスペクト比を修正
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
  distance = (size.height / 2) / Math.tan(fovRadian);
  camera.position.z = distance;

  mesh.material.uniforms.uResolution.value.set(size.width, size.height);
  // const scaleX = size.width / mesh.geometry.parameters.width + 0.01;
  // const scaleY = size.height / mesh.geometry.parameters.height + 0.01;
  const scaleX = Math.round(size.width / mesh.geometry.parameters.width * 100) / 100 + 0.01;
  const scaleY = Math.round(size.height / mesh.geometry.parameters.height * 100) / 100 + 0.01;

  mesh.scale.set(scaleX, scaleY, 1);

}
window.addEventListener("resize", onWindowResize);

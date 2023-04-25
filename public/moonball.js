import Utility from '/utility.js';
import U3D from '/utility3d.js';
import Asteroid3D from '/asteroid3d.js';
import Collision3D from '/collision3d.js';
import * as YUKA from './fps/yuka.module.js'

//import './babylon.js'
//import './babylonjs.materials.min.js'

import { AssetManager } from './fps/AssetManager.js'
import { Bullet } from './fps/Bullet.js'
import { Ground } from './fps/Ground.js'
import { Player } from './fps/Player.js'
import { Target } from './fps/Target.js'
import { FirstPersonControls } from './fps/FirstPersonControls.js'

const target = new YUKA.Vector3()
const intersection = {
  point: new YUKA.Vector3(),
  normal: new YUKA.Vector3(),
}

const entityMatrix = new BABYLON.Matrix()
const cameraEntityMatrix = new BABYLON.Matrix()

export class MoonBallApp {
  constructor() {
    this.urlParams = new URLSearchParams(window.location.search);
    if (this.urlParams.get('instrumentation'))
      this.instrumentationOn = true;

    this.entityManager = new YUKA.EntityManager()
    this.time = new YUKA.Time();

    this.maxBulletHoles = 20

    this.camera = null
    this.scene = null
    this.renderer = null
    this.audios = new Map()
    this.animations = new Map()

    this.player = null
    this.controls = null
    this.obstacles = new Array()
    this.bulletHoles = new Array()

    this.assetManager = new AssetManager()

    this.animate = animate.bind(this)
    this.onIntroClick = onIntroClick.bind(this)
    this.onWindowResize = onWindowResize.bind(this)

    this.ui = {
      intro: document.getElementById('intro'),
      crosshairs: document.getElementById('crosshairs'),
      loadingScreen: document.getElementById('loading-screen'),
    }

    this.load();
  }
  async load() {
    await this.initGraphics();
    await this._initContent3D();

    //this.initScene()
    await this.assetManager.init(this.scene)
    this.initGround()
    this.initPlayer()
    this.initControls()
    this.initTarget()
    this.initUI()

    this.animate()
  }
  async initGraphics() {
    if (this.engine)
      return;

    this.cameraMetaX = {
      position: U3D.v(5, 3, 0),
      target: U3D.v(0, 2, 0)
    };

    this.canvas = document.querySelector("canvas");
    this.engine = new BABYLON.Engine(this.canvas, true);
    this.engine.enableOfflineSupport = false;
    BABYLON.OBJFileLoader.OPTIMIZE_WITH_UV = true;
    BABYLON.Animation.AllowMatricesInterpolation = true;

    this.engine.enableOfflineSupport = false;
    this.scene = await this.createScene();

    window.addEventListener("resize", () => {
      this.engine.resize();
    });
  }
  async _initContent3D() {
    let startTime = new Date();
    this.sceneTransformNode = new BABYLON.TransformNode('sceneBaseNodeForScale', this.scene);
    this.gui3DManager = new BABYLON.GUI.GUI3DManager(this.scene);

    this.scene.collisionsEnabled = false;
    let count = 50;
    this.asteroidHelper = new Asteroid3D(this);

    await this.asteroidHelper.init(count);
    this.collisionHelper = new Collision3D(this, count);
    await this.collisionHelper.init();

    this.xr.baseExperience.camera.onBeforeCameraTeleport.add(() => {
      this.clearActiveFollowMeta();
    });

    this.paintedBoardTurn = this.turnNumber;
    this.startEngine();

    this.enterNotInXR();

    this.paintGameData();
  }
  async createScene() {
    let scene = new BABYLON.Scene(this.engine);
    this.scene = scene;
    this.scene.autoClear = false; // Color buffer
    this.scene.autoClearDepthAndStencil = false; // Depth and stencil, obviously
    if (this.instrumentationOn) {
      let instrumentation = new BABYLON.SceneInstrumentation(this.scene);
      instrumentation.captureFrameTime = true;
      setInterval(() => {
        let perfValue = instrumentation.frameTimeCounter.lastSecAverage.toFixed(2);
        console.log(perfValue + "ms per frame");
      }, 300);
    }

    this.mainLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, -1, 0), this.scene);
    this.mainLight.intensity = 0.8;
    this.scene.mainLight = this.mainLight;

    let environment = scene.createDefaultEnvironment({
      createSkybox: false,
      createGround: false,
      enableGroundShadow: false,
      enableGroundMirror: false
    });
    this.env = environment;

    scene.createDefaultCamera(false, true, true);
    this.camera = scene.activeCamera;

    scene.activeCamera.position = U3D.vector(this.cameraMetaX.position);
    scene.activeCamera.setTarget(U3D.vector(this.cameraMetaX.target));
    scene.activeCamera.speed = 0.5;
    this.camera.angularSensibility = 5000;
    scene.activeCamera.storeState();
    this.environmentRadius = 35;

    let equipath = `/media/stars8k.jpg`;
    this.photoDome = new BABYLON.PhotoDome(
      "photoDome",
      equipath, {
        resolution: 256,
        size: this.environmentRadius * 2.5
      },
      this.scene
    );
    this.photoDome.imageMode = BABYLON.PhotoDome.MODE_MONOSCOPIC;
    this.photoDome.fovMultiplier = 2.0;
    this.photoDome.isPickable = false;

    this.xr = await scene.createDefaultXRExperienceAsync({});
    this.toggleXRMovementType();

    this.scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case BABYLON.PointerEventTypes.POINTERDOWN:
          /*
            if (pointerInfo.pickInfo.hit) {
              if (this.pointerDown(pointerInfo))
                break;
            }
            if (pointerInfo.pickInfo.pickedMesh === this.env.ground) {
              this.groundClick(pointerInfo);
              break;
            }
            */
          break;
        case BABYLON.PointerEventTypes.POINTERUP:
          //this.pointerUp(pointerInfo);
          break;
        case BABYLON.PointerEventTypes.POINTERMOVE:
          //this.pointerMove(pointerInfo);
          break;
      }
    });

    this.xr.input.onControllerAddedObservable.add((controller) => {
      controller.onMotionControllerInitObservable.add((motionController) => {
        motionController.onModelLoadedObservable.add(mc => {
          this.XRControllerAdded(controller, motionController.handedness);
        })

        let yComponent = motionController.getComponent('y-button');
        if (yComponent)
          yComponent.onButtonStateChangedObservable.add(btn => {
            if (btn.pressed) {
              this.yButtonPress();
            }
          });
        let xComponent = motionController.getComponent('x-button');
        if (xComponent)
          xComponent.onButtonStateChangedObservable.add(btn => {
            if (btn.pressed) {
              this.xButtonPress();
            }
          });
        let aComponent = motionController.getComponent('a-button');
        if (aComponent)
          aComponent.onButtonStateChangedObservable.add(btn => {
            if (btn.pressed) {
              this.aButtonPress();
            }
          });
        let bComponent = motionController.getComponent('b-button');
        if (bComponent)
          bComponent.onButtonStateChangedObservable.add(btn => {
            if (btn.pressed) {
              this.bButtonPress();
            }
          });
      });
    });

    this.xr.baseExperience.onInitialXRPoseSetObservable.add(() => {
      // append the initial position of the camera to the parent node
      //childForCamera.position.addInPlace(xr.baseExperience.camera.position);
      this.xr.baseExperience.sessionManager.onXRFrameObservable.add(() => {

        if (this.activeFollowMeta && this.activeFollowMeta.basePivot) {
          let position = new BABYLON.Vector3(0, 0, 0);
          position.copyFrom(this.activeFollowMeta.basePivot.getAbsolutePosition());
          position.y += 4;

          let mX = position.x - this.scene.activeCamera.position.x;
          let mZ = position.z - this.scene.activeCamera.position.z;

          let movementVector = new BABYLON.Vector3(mX, 0, mZ);
          this.xr.baseExperience.camera.position.copyFrom(position);
        }
      })
    });

    this.xr.baseExperience.onStateChangedObservable.add((state) => {
      switch (state) {
        case BABYLON.WebXRState.IN_XR:
          this.enterXR();
          break;
        case BABYLON.WebXRState.NOT_IN_XR:
          this.enterNotInXR();
          break;
      }
    });

    return scene;
  }

  addLineToLoading(str) {
    console.log("Loading: ", str);
  }

  toggleXRMovementType() {
    if (!this.currentXRFeature) {
      this.xr.baseExperience.featuresManager.disableFeature(BABYLON.WebXRFeatureName.TELEPORTATION);
      this.xr.baseExperience.featuresManager.enableFeature(BABYLON.WebXRFeatureName.MOVEMENT, "stable", {
        xrInput: this.xr.input,
        movementSpeed: 0.075,
        rotationSpeed: 0.15
      });
      this.currentXRFeature = 'movement';
      //this.xr.teleportation.setSelectionFeature(null);
    } else {
      this.xr.baseExperience.featuresManager.disableFeature(BABYLON.WebXRFeatureName.MOVEMENT);

      this.xr.teleportation = this.xr.baseExperience.featuresManager.enableFeature(BABYLON.WebXRFeatureName.TELEPORTATION, "stable", {
        xrInput: this.xr.input,
        floorMeshes: [this.env.ground]
      });
      this.xr.teleportation.setSelectionFeature(this.xr.pointerSelection);
      this.currentXRFeature = false;
    }
  }
  startEngine() {
    if (this.engine3DStarted)
      return;
    this.engine3DStarted = true;
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }
  enterXR() {
    this.inXR = true;
  }
  enterNotInXR() {
    this.inXR = false;

  }
  XRControllerAdded(model, handed) {
    if (handed === 'left') {
      this.leftHandedControllerGrip = model.grip;
      let cylinder = BABYLON.MeshBuilder.CreateCylinder('leftpaddle', {
        height: 0.25,
        diameter: 0.15
      }, this.scene);
      cylinder.parent = this.leftHandedControllerGrip;
      cylinder.position = U3D.v(0, 0.2, 0);
      cylinder.rotation = U3D.v(0, 0, Math.PI / 6);

    }
    if (handed === 'right') {
      this.rightHandedControllerGrip = model.grip;
    }
  }
  paintGameData() {

  }
  async readJSONFile(path) {
    try {
      let response = await fetch(path);
      return await response.json();
    } catch (e) {
      console.log('ERROR with download of ' + path, e);
      return {};
    }
  }
  _shuffleArray(array) {
    let currentIndex = array.length,
      randomIndex;
    while (0 !== currentIndex) {

      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]
      ];
    }
    return array;
  }

  update() {
    const delta = this.time.update().getDelta()

    this.controls.update(delta)
    this.entityManager.update(delta)

    this.scene.render()
  }

  add(entity) {
    this.entityManager.add(entity)

    if (entity.geometry) {
      this.obstacles.push(entity)
    }
  }

  remove(entity) {
    this.entityManager.remove(entity)

    if (entity._renderComponent !== null) {
      entity._renderComponent.dispose()
    }

    if (entity.geometry) {
      const index = this.obstacles.indexOf(entity)

      if (index !== -1) {
        this.obstacles.splice(index, 1)
      }
    }
  }

  addBullet(owner, ray) {
    const bulletLine = this.assetManager.models.get('bulletLine').clone('bullet-line')
    bulletLine.setEnabled(true)

    const bullet = new Bullet(owner, ray)
    bullet.setRenderComponent(bulletLine, sync)

    this.add(bullet)
  }

  addBulletHole(position, normal, audio) {
    const bulletHole = this.assetManager.models.get('bulletHole').clone('bullet-hole' + this.bulletHoles.length)
    bulletHole.setEnabled(true)
    audio.attachToMesh(bulletHole)

    const s = 1 + Math.random() * 0.5
    bulletHole.scaling = new BABYLON.Vector3(s, s, s)
    bulletHole.position = new BABYLON.Vector3(position.x, position.y, position.z)

    target.copy(position).add(normal)

    bulletHole.lookAt(new BABYLON.Vector3(target.x, target.y, target.z))

    if (this.bulletHoles.length >= this.maxBulletHoles) {
      const toRemove = this.bulletHoles.shift()
      toRemove.dispose()
    }

    this.bulletHoles.push(bulletHole)
  }

  intersectRay(ray, intersectionPoint, normal = null) {
    const obstacles = this.obstacles
    let minDistance = Infinity
    let closestObstacle = null

    for (let i = 0, l = obstacles.length; i < l; i++) {
      const obstacle = obstacles[i]

      if (
        obstacle.geometry.intersectRay(ray, obstacle.worldMatrix, false, intersection.point, intersection.normal) !==
        null
      ) {
        const squaredDistance = intersection.point.squaredDistanceTo(ray.origin)

        if (squaredDistance < minDistance) {
          minDistance = squaredDistance
          closestObstacle = obstacle

          intersectionPoint.copy(intersection.point)
          if (normal) {
            normal.copy(intersection.normal)
          }
        }
      }
    }

    return closestObstacle === null ? null : closestObstacle
  }

  initScene() {
    const canvas = document.getElementById('renderCanvas')
    this.engine = new BABYLON.Engine(canvas, true, {}, true)

    if (BABYLON.Engine.audioEngine) {
      BABYLON.Engine.audioEngine.useCustomUnlockedButton = true
    }

    this.scene = new BABYLON.Scene(this.engine)
    const scene = this.scene

    scene.clearColor = new BABYLON.Color4(0.6, 0.6, 0.6, 1)
    scene.useRightHandedSystem = true

    scene.fogMode = BABYLON.Scene.FOGMODE_EXP2
    scene.fogColor = BABYLON.Color3.FromHexString('#a0a0a0')
    scene.fogDensity = 0.005

    const camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 0, 0), scene, true)
    camera.minZ = 0.01
    camera.max = 1000
    this.camera = camera

    new BABYLON.HemisphericLight('light', new BABYLON.Vector3(-1, 1, 0))

    this.dirLight = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-1, -1, -1), scene)
    this.dirLight.position = new BABYLON.Vector3(10, 9, 3)

    this.audios = this.assetManager.audios

    this.shadowGenerator = new BABYLON.ShadowGenerator(2048, this.dirLight)
    this.shadowGenerator.useBlurExponentialShadowMap = true
    this.shadowGenerator.useKernelBlur = true
    this.shadowGenerator.blurKernel = 32

    window.addEventListener('resize', this.onWindowResize, false)
    this.ui.intro.addEventListener('click', this.onIntroClick, false)
  }

  initGround() {
    const groundMesh = this.assetManager.models.get('ground')

    const vertices = groundMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)
    const indices = groundMesh.getIndices()
    const geometry = new YUKA.MeshGeometry(vertices, indices)

    const ground = new Ground(geometry)
    ground.setRenderComponent(groundMesh, sync)

    this.add(ground)
  }

  initPlayer() {
    const player = new Player(this.camera)
    player.head.setRenderComponent(this.camera, syncCamera)

    this.add(player)
    this.player = player

    // weapon
    const weapon = player.weapon
    const weaponMesh = this.assetManager.models.get('weapon')
    weapon.setRenderComponent(weaponMesh, sync)

    this.shadowGenerator.addShadowCaster(weaponMesh)

    // audios
    this.audios.get('shot').attachToMesh(weaponMesh)
    this.audios.get('reload').attachToMesh(weaponMesh)
    this.audios.get('empty').attachToMesh(weaponMesh)

    // animations
    this.animations = this.assetManager.animations
  }

  initControls() {
    const player = this.player

    this.controls = new FirstPersonControls(player)

    const intro = this.ui.intro
    const crosshairs = this.ui.crosshairs

    this.controls.addEventListener('lock', () => {
      intro.classList.add('hidden')
      crosshairs.classList.remove('hidden')
    })

    this.controls.addEventListener('unlock', () => {
      intro.classList.remove('hidden')
      crosshairs.classList.add('hidden')
    })
  }

  initTarget() {
    const targetMesh = this.assetManager.models.get('target')
    this.shadowGenerator.addShadowCaster(targetMesh)

    const vertices = targetMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)
    const indices = targetMesh.getIndices()

    const geometry = new YUKA.MeshGeometry(vertices, indices)
    const target = new Target(geometry)
    target.position.set(0, 5, -20)

    target.setRenderComponent(targetMesh, sync)

    this.add(target)
  }

  initUI() {
    const loadingScreen = this.ui.loadingScreen

    loadingScreen.classList.add('fade-out')
    loadingScreen.addEventListener('transitionend', onTransitionEnd)
  }
}


function sync(entity, renderComponent) {
  renderComponent.getWorldMatrix().copyFrom(BABYLON.Matrix.FromValues(...entity.worldMatrix.elements))
}

// function sync(entity, renderComponent) {
//   BABYLON.Matrix.FromValues(...entity.worldMatrix.elements).decomposeToTransformNode(renderComponent)
// }

function syncCamera(entity, renderComponent) {
  renderComponent.getViewMatrix().copyFrom(BABYLON.Matrix.FromValues(...entity.worldMatrix.elements).invert())
}

function onIntroClick() {
  if (BABYLON.Engine.audioEngine) {
    BABYLON.Engine.audioEngine.unlock()
  }

  this.controls.connect()
}

function onWindowResize() {
  this.engine.resize()
}

function onTransitionEnd(event) {
  event.target.remove()
}

function animate() {
  requestAnimationFrame(this.animate)

  this.update()
}

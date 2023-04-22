import Utility from '/utility.js';
import U3D from '/utility3d.js';
import Asteroid3D from '/asteroid3d.js';
import Collision3D from '/collision3d.js';
import Gun3D from '/gun3d.js';
import * as YUKA from './fps/yuka.module.js'

export class MoonBallApp {
  constructor() {
    this.urlParams = new URLSearchParams(window.location.search);
    if (this.urlParams.get('instrumentation'))
      this.instrumentationOn = true;

    this.entityManager = new YUKA.EntityManager()
    this.time = new YUKA.Time();


    this.load();
  }
  async load() {
    await this.initGraphics();
    await this._initContent3D();

    this.gun3D = new Gun3D(this);
    await this.gun3D.init();

    //  this.gun3D.gunMesh.parent = this.scene.activeCamera;
    let weapon = this.models.get('weapon');
    weapon.scaling = new BABYLON.Vector3(0.6, 0.6, 0.6)
    weapon.position = new BABYLON.Vector3(1, -1.5, 5)
    weapon.rotation = new BABYLON.Vector3(-Math.PI / 2, Math.PI, Math.PI / 2)
    //weapon.bakeCurrentTransformIntoVertices()
    weapon.renderingGroupId = 2
  //  gunMesh.freezeWorldMatrix()
    weapon.alwaysSelectAsActiveMesh = true
    weapon.parent = this.scene.activeCamera;

    //this.gun3D.gunMesh.position = U3D(-20, -1, 0);
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

  addBullet(owner, ray) {
    const bulletLine = this.assetManager.models.get('bulletLine').clone('bullet-line')
    bulletLine.setEnabled(true)

    const bullet = new Bullet(owner, ray)
    bullet.setRenderComponent(bulletLine, sync)

    this.add(bullet)
  }
}

import Utility from '/utility.js';
import U3D from '/utility3d.js';
import Asteroid3D from '/asteroid3d.js';
import Collision3D from '/collision3d.js';

export class MoonBallApp {
  constructor() {
    this.urlParams = new URLSearchParams(window.location.search);
    if (this.urlParams.get('instrumentation'))
      this.instrumentationOn = true;

    this.load();
  }
  async load() {
    await this.initGraphics();
    await this._initContent3D();

    new Collision3D(this.scene);
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

    this.pipeline = new BABYLON.DefaultRenderingPipeline("default", true, this.scene, [this.camera, this.xr.baseExperience.camera]);
    this.scene.imageProcessingConfiguration.toneMappingEnabled = true;
    this.scene.imageProcessingConfiguration.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
    this.scene.imageProcessingConfiguration.exposure = 1;
    this.pipeline.glowLayerEnabled = true;
    this.pipeline.glowLayer.intensity = 0.35;

    window.addEventListener("resize", () => {
      this.engine.resize();
    });
  }
  async _initContent3D() {
    let startTime = new Date();
    this.sceneTransformNode = new BABYLON.TransformNode('sceneBaseNodeForScale', this.scene);
    this.gui3DManager = new BABYLON.GUI.GUI3DManager(this.scene);

    //this.createMenu3DWrapper();
    this.scene.collisionsEnabled = false;
    //this.menuTab3D = new MenuTab3D(this);
    this.asteroidHelper = new Asteroid3D(this);
    await this.asteroidHelper.loadAsteroids()
    /*
    this.helpSlateHelper = new HelpSlate(this);
    this.chatSlateHelper = new ChatSlate(this);
    this.invisibleMaterial = new BABYLON.StandardMaterial("invisiblematerial", this.scene);
    this.invisibleMaterial.alpha = 0;
    */

    this.xr.baseExperience.camera.onBeforeCameraTeleport.add(() => {
      this.clearActiveFollowMeta();
    });
    /*
        this.addLineToLoading('Loading Assets...<br>');
        let promises = [];
        this.solarSystemDeck.forEach(card => {
          promises.push(this.loadStaticAsset(card.id, this.sceneTransformNode, this.scene));
        });
        this.moonsDeck1.forEach(card => {
          promises.push(this.loadStaticAsset(card.id, this.sceneTransformNode, this.scene));
        });
        this.moonsDeck2.forEach(card => {
          promises.push(this.loadStaticAsset(card.id, this.sceneTransformNode, this.scene));
        });

        this.avatarHelper = new Avatar3D(this);
        let loadingResults;
        await Promise.all([
          this.avatarHelper.loadAndInitAvatars(),
          (loadingResults = await Promise.all(promises)),
          this.asteroidHelper.loadAsteroids(),
          Recast()
        ]);
    */
    /*
        this.playerMoonAssets = new Array(4);
        let loadingHTML = '';
        loadingResults.forEach(assetMesh => {
          let meta = assetMesh.assetMeta;

          if (meta.seatIndex !== undefined)
            this.playerMoonAssets[meta.seatIndex] = assetMesh;

          let normalLink = `<a href="${meta.extended.glbPath}" target="_blank">Asset</a>&nbsp;`;
          let imgHTML = meta.symbol ? `<img src="${meta.extended.symbolPath}" class="symbol_image">` : '';

          loadingHTML += `${meta.name}:
            &nbsp;
            ${normalLink}
            <br>
            <a href="${meta.url}" target="_blank">wiki</a>
            &nbsp; ${imgHTML}
            <br>`;

          if (meta.noClick !== true) {
            meta.appClickable = true;
            meta.clickCommand = 'customClick';
            meta.handlePointerDown = async (pointerInfo, mesh, meta) => {
              this.pauseAssetSpin(pointerInfo, mesh, meta);
            };
          }
        });
        this.addLineToLoading(loadingHTML);

        this.menuTab3D.initOptionsBar();
        this.channelSpeechHelper = new ChannelSpeech(this);
        this.actionChannelHelper = new ChannelAction(this);

        let delta = new Date().getTime() - startTime.getTime();
        console.log('init3D', delta);
        this.addLineToLoading(`${delta} ms to load 3D content<br>`);
    */
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
      groundOpacity: 0,
      groundSize: 150,
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

    this.initSkybox();
    this.xr = await scene.createDefaultXRExperienceAsync({
      floorMeshes: [environment.ground]
    });

    environment.ground.isPickable = false;
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
  initSkybox() {
    let equipath = `/media/stars8k.jpg`;
    if (!this.photoDome) {
      this.photoDome = new BABYLON.PhotoDome(
        "photoDome",
        equipath, {
          resolution: 256,
          size: 150
        },
        this.scene
      );
      this.photoDome.imageMode = BABYLON.PhotoDome.MODE_MONOSCOPIC;
      this.photoDome.fovMultiplier = 2.0;
      this.photoDome.isPickable = false;
    } else {
      if (this.photoDome.photoTexture)
        this.photoDome.photoTexture.dispose();
      this.photoDome.photoTexture = new BABYLON.Texture(equipath, this.scene, false, true);
    }
  }
  addLineToLoading(str) {
    console.log("Loading: ", str);
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
      this.menuBarTransformNode.parent = model.grip;
      console.log(model)
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
}

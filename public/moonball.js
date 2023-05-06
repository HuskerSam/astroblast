import Utility from '/utility.js';
import U3D from '/utility3d.js';
import Asteroid3D from '/asteroid3d.js';
import Collision3D from '/collision3d.js';
import Bullet3D from '/bullet3d.js';
import Blaster3D from '/blaster3d.js';

export class MoonBallApp {
  constructor() {
    this.urlParams = new URLSearchParams(window.location.search);
    if (this.urlParams.get('instrumentation'))
      this.instrumentationOn = true;
    this.time = new Date();

    this.maxBulletHoles = 20

    this.camera = null
    this.scene = null
    this.renderer = null
    this.audios = new Map()
    this.animations = new Map()
    this.obstacles = new Array();
    this.activeBullets = new Array();

    this.player = null
    this.controls = null
    this.obstacles = new Array()
    this.bulletHoles = new Array();

    this.roundType = "1";

    this.asteroidCount = 50;

    //  this.assetManager = new AssetManager()

    this.load();
  }
  async load() {
    await this.initGraphics();
    await this._initContent3D();

    this.audios = new Map();
    this.loadAudios();

    this.blaster3D = new Blaster3D(this);
    await this.blaster3D.load();

    this.initHitShaders();

    document.querySelector('.hide_loadingscreen').innerHTML = "Play!";
    document.querySelector('.hide_loadingscreen').addEventListener('click', e => {
      BABYLON.Engine.audioEngine.unlock();
      document.querySelector('.loading_screen').style.display = 'none';
      this.initRound();
    });

    document.querySelectorAll('input[name="roundtype"]').forEach(ctl => ctl.addEventListener('input', e => {
      this.initRound();
    }));
  }
  async initRound() {
    this.roundType = document.querySelector('input[name="roundtype"]:checked').value;
    if (!this.collisionHelper)
      this.collisionHelper = new Collision3D(this, this.asteroidCount);

    await this.collisionHelper.init();
  }
  async initGraphics() {
    if (this.engine)
      return;

    this.cameraMetaX = {
      position: U3D.v(0, 0, 0),
      target: U3D.v(2, 0, 2)
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
  loadAudios() {
    const audios = this.audios

    const step1 = new BABYLON.Sound('step1', 'audio/step1.ogg', this.scene, null, {
      loop: false,
      autoplay: false,
    })
    const step2 = new BABYLON.Sound('step2', 'audio/step2.ogg', this.scene, null, {
      loop: false,
      autoplay: false,
    })
    const shot = new BABYLON.Sound('shot', 'audio/shot.ogg', this.scene, null, {
      loop: false,
      autoplay: false,
    })
    const reload = new BABYLON.Sound('reload', 'audio/reload.ogg', this.scene, null, {
      loop: false,
      autoplay: false,
    })
    const impact1 = new BABYLON.Sound('impact1', 'audio/impact1.ogg', this.scene, null, {
      loop: false,
      autoplay: false,
    })
    const impact2 = new BABYLON.Sound('impact2', 'audio/impact1.ogg', this.scene, null, {
      loop: false,
      autoplay: false,
    })
    const impact3 = new BABYLON.Sound('impact3', 'audio/impact1.ogg', this.scene, null, {
      loop: false,
      autoplay: false,
    })
    const impact4 = new BABYLON.Sound('impact4', 'audio/impact1.ogg', this.scene, null, {
      loop: false,
      autoplay: false,
    })
    const impact5 = new BABYLON.Sound('impact5', 'audio/impact1.ogg', this.scene, null, {
      loop: false,
      autoplay: false,
    })
    const empty = new BABYLON.Sound('empty', 'audio/empty.ogg', this.scene, null, {
      loop: false,
      autoplay: false,
    })

    shot.setVolume(0.3)
    reload.setVolume(0.1)
    empty.setVolume(0.3)

    audios.set('step1', step1)
    audios.set('step2', step2)
    audios.set('shot', shot)
    audios.set('reload', reload)
    audios.set('impact1', impact1)
    audios.set('impact2', impact2)
    audios.set('impact3', impact3)
    audios.set('impact4', impact4)
    audios.set('impact5', impact5)
    audios.set('empty', empty)
  }
  sendMessage(name, options) {
    console.log('message', name, options)
  }
  async _initContent3D() {
    let startTime = new Date();
    this.sceneTransformNode = new BABYLON.TransformNode('sceneBaseNodeForScale', this.scene);
    this.gui3DManager = new BABYLON.GUI.GUI3DManager(this.scene);

    this.scene.collisionsEnabled = false;

    this.asteroidHelper = new Asteroid3D(this);
    await this.asteroidHelper.init(this.asteroidCount);

    this.initRound();

    if (this.xr) {
      this.xr.baseExperience.camera.onBeforeCameraTeleport.add(() => {
        this.clearActiveFollowMeta();
      });
    }

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
        let perfValue = instrumentation.frameTimeCounter.lastSecAverage.toFixed(1);
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


    this.camera = new BABYLON.DeviceOrientationCamera("DeviceOrientationCamera", U3D.vector(this.cameraMetaX.position), this.scene);
    this.camera.attachControl(this.canvas, true);
/*
        scene.createDefaultCamera(false, true, true);
    this.camera = scene.activeCamera;
*/
    this.scene.activeCamera = this.camera;
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
    this.photoDome.mesh.isPickable = false;

    try {
      this.xr = await scene.createDefaultXRExperienceAsync({});
      this.toggleXRMovementType();
    } catch (xrError) {
      console.log('xrerror', xrError);
      this.xr = null;
    }

    this.scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case BABYLON.PointerEventTypes.POINTERDOWN:
          if (pointerInfo.pickInfo.hit) {
            if (this.pointerDown(pointerInfo))
              break;
          }
          break;
        case BABYLON.PointerEventTypes.POINTERUP:
          //this.pointerUp(pointerInfo);
          break;
        case BABYLON.PointerEventTypes.POINTERMOVE:
          //this.pointerMove(pointerInfo);
          break;
      }
    });

    if (this.xr) {
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
    }
    return scene;
  }
  pointerDown(eventInfo) {
    if (eventInfo.pickInfo && eventInfo.pickInfo.pickedMesh) {
      let mesh = U3D.getRootNode(eventInfo.pickInfo.pickedMesh);

      if (mesh.leftWeaponMesh) {
        this.blaster3D.shoot(true);
      }
      if (mesh.rightWeaponMesh) {
        this.blaster3D.shoot(false);
      }
    }
  }
  addLineToLoading(str) {
    console.log("Loading: ", str);
  }

  toggleXRMovementType() {
    if (!this.xr)
      return;

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
      this.updateFrame();
      this.scene.render();
    });
  }
  enterXR() {
    this.inXR = true;
    this.blaster3D.connectGunsInXR();
  }
  enterNotInXR() {
    this.inXR = false;
    if (this.blaster3D)
      this.blaster3D.connectGunsNotInXR();
  }
  XRControllerAdded(model, handed) {
    if (handed === 'left') {
      this.leftHandedControllerGrip = model.grip;
      this.blaster3D.connectGunsInXR();
    }
    if (handed === 'right') {
      this.rightHandedControllerGrip = model.grip;
      this.blaster3D.connectGunsInXR();
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

  updateFrame() {
    if (this.blaster3D)
      this.blaster3D.updateFrame();

    this.activeBullets.forEach(bullet => bullet.updateFrame());
  }
  removeBullet(bullet) {
    let bIndex = this.activeBullets.indexOf(bullet);
    if (bIndex > -1) {
      this.activeBullets[bIndex].dispose();
      this.activeBullets.splice(bIndex, 1);
    }
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
  updateUI() {

  }
  initUI() {
    const loadingScreen = this.ui.loadingScreen

    loadingScreen.classList.add('fade-out')
    loadingScreen.addEventListener('transitionend', onTransitionEnd)
  }
  static intersectRay(ray, intersectionPoint, normal = null) {
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
          closestObstacle.lastIntersection = intersection;

          intersectionPoint.copy(intersection.point)
          if (normal) {
            normal.copy(intersection.normal)
          }
        }
      }
    }

    return closestObstacle === null ? null : closestObstacle
  }
  checkForBulletHit(particle) {
    this.activeBullets.forEach(bullet => {
      if (bullet.beenHit)
        return;

      let hit = particle.intersectsMesh(bullet.sceneBullet);
      if (hit) {
        if (!particle.beenHit) {
          particle.beenHit = true;
          bullet.beenHit = true;

          particle.position.x += particle.velocity.x;
          particle.position.y += particle.velocity.y;
          particle.position.z += particle.velocity.z;

          let rotation = U3D.vector(particle.rotation);
          let position = U3D.vector(particle.position);

          particle.position = U3D.v(100000, 100000, 100000);
          let asteroidName = this.collisionHelper.asteroidNames[particle.shapeId];
          bullet.hitObstacle(particle, position, rotation, asteroidName);
        }
      }
    });
  }
  initHitShaders() {
    let fragmentSourceRed =
      `precision highp float;
      varying vec2 vUV;

      uniform sampler2D textureSampler;
      uniform float time;
      uniform mat4 worldView;
      varying vec4 vPosition;
      varying vec3 vNormal;
      // Uniforms
      uniform mat4 view;
      uniform vec3 cameraPosition;
      uniform vec3 viewportPosition;

      float snoise(vec3 uv, float res)
      {
      const vec3 s = vec3(1e0, 1e2, 1e3);

      uv *= res;

      vec3 uv0 = floor(mod(uv, res))*s;
      vec3 uv1 = floor(mod(uv+vec3(1.), res))*s;

      vec3 f = fract(uv); f = f*f*(3.0-2.0*f);

      vec4 v = vec4(uv0.x+uv0.y+uv0.z, uv1.x+uv0.y+uv0.z,
                  uv0.x+uv1.y+uv0.z, uv1.x+uv1.y+uv0.z);

      vec4 r = fract(sin(v*1e-1)*1e3);
      float r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);

      r = fract(sin((v + uv1.z - uv0.z)*1e-1)*1e3);
      float r1 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);

      return mix(r0, r1, f.z)*2.-1.;
      }

      void main(void) {

        vec3 e = normalize( vec3( worldView * vPosition ) );
        vec2 uv = vUV.xy;

      vec2 p = -.5 + vUV.xy;

      float color = 3.0 - (3.*length(2.*p));

      vec3 coord = vec3(atan(p.x,p.y)/6.2832+.5, length(p)*.4, .5);

      for(int i = 1; i <= 7; i++)
      {
        float power = pow(2.0, float(i));
        color += (1.5 / power) * snoise(coord + vec3(0.,-time*.05, time*.01), power*16.);
      }
        gl_FragColor = vec4( color, pow(max(color,0.),2.)*0.4, pow(max(color,0.),3.)*0.15 , 1.0);
      }`;

    let vertexSourceRed =
      `precision highp float;
      // Attributes
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uv;

      // Uniforms
      uniform mat4 worldViewProjection;

      // Varying
      varying vec4 vPosition;
      varying vec3 vNormal;
      varying vec2 vUV;

      void main(void) {
        gl_Position = worldViewProjection * vec4(position, 1.0);

        vUV = uv;
      }`;
    this.redHitShaderMaterial = new BABYLON.ShaderMaterial("shader", this.scene, {
      vertexSource: vertexSourceRed,
      fragmentSource: fragmentSourceRed,
    }, {
      attributes: ["position", "normal", "uv"],
      uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"]
    });

    this.redHitShaderMaterial.setFloat("time", 0);
    this.redHitShaderMaterial.backFaceCulling = false;
    this.redHitShaderMaterial.wireframe = true;

    let fragmentSourceBlue =
      `precision highp float;
      varying vec2 vUV;

      uniform sampler2D textureSampler;
      uniform float time;
      uniform mat4 worldView;
      varying vec4 vPosition;
      varying vec3 vNormal;
      // Uniforms
      uniform mat4 view;
      uniform vec3 cameraPosition;
      uniform vec3 viewportPosition;

      float snoise(vec3 uv, float res)
      {
      const vec3 s = vec3(1e0, 1e2, 1e3);

      uv *= res;

      vec3 uv0 = floor(mod(uv, res))*s;
      vec3 uv1 = floor(mod(uv+vec3(1.), res))*s;

      vec3 f = fract(uv); f = f*f*(3.0-2.0*f);

      vec4 v = vec4(uv0.x+uv0.y+uv0.z, uv1.x+uv0.y+uv0.z,
                  uv0.x+uv1.y+uv0.z, uv1.x+uv1.y+uv0.z);

      vec4 r = fract(sin(v*1e-1)*1e3);
      float r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);

      r = fract(sin((v + uv1.z - uv0.z)*1e-1)*1e3);
      float r1 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);

      return mix(r0, r1, f.z)*2.-1.;
      }

      void main(void) {

        vec3 e = normalize( vec3( worldView * vPosition ) );
        vec2 uv = vUV.xy;

      vec2 p = -.5 + vUV.xy;

      float color = 3.0 - (3.*length(2.*p));

      vec3 coord = vec3(atan(p.x,p.y)/6.2832+.5, length(p)*.4, .5);

      for(int i = 1; i <= 7; i++)
      {
        float power = pow(2.0, float(i));
        color += (1.5 / power) * snoise(coord + vec3(0.,-time*.05, time*.01), power*16.);
      }
        gl_FragColor = vec4( pow(max(color,0.),3.)*0.15, pow(max(color,0.),2.)*0.4, color, 1.0);
      }`;

    let vertexSourceBlue =
      `precision highp float;
      // Attributes
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uv;

      // Uniforms
      uniform mat4 worldViewProjection;

      // Varying
      varying vec4 vPosition;
      varying vec3 vNormal;
      varying vec2 vUV;

      void main(void) {
        gl_Position = worldViewProjection * vec4(position, 1.0);

        vUV = uv;
      }`;
    this.blueHitShaderMaterial = new BABYLON.ShaderMaterial("shader", this.scene, {
      vertexSource: vertexSourceBlue,
      fragmentSource: fragmentSourceBlue,
    }, {
      attributes: ["position", "normal", "uv"],
      uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"]
    });

    this.blueHitShaderMaterial.setFloat("time", 0);
    this.blueHitShaderMaterial.backFaceCulling = false;
    this.blueHitShaderMaterial.wireframe = true;

    let time = 0;
    setInterval(() => {
      time += 0.1;
      this.redHitShaderMaterial.setFloat("time", time);
      this.blueHitShaderMaterial.setFloat("time", time);
    }, 10);
  }
}

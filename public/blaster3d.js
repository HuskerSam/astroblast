import U3D from '/utility3d.js';
import Bullet3D from '/bullet3d.js';

export default class Blaster3D {
  constructor(app) {
    this.app = app;

    this.status = STATUS.READY;

    this.animations = new Map();

    this.roundsLeft = 1200;
    this.roundsPerClip = 12;
    this.ammo = 48;
    this.maxAmmo = 96;


    this.shotTime = 200;
    this.reloadTime = 1500;
    this.muzzleFireTime = 100;

    this.shotCooldown = 500
    this.lastLeftShot = 0;
    this.lastRightShot = 0;

    this.endTimeShot = Infinity;
    this.endTimeReload = Infinity;
    this.endTimeMuzzleFire = Infinity;


  }
  connectGunsInXR() {
    this.leftWeaponMesh.parent = this.app.leftHandedControllerGrip;
    this.leftWeaponMesh.scaling = U3D.v(0.1);
    this.leftWeaponMesh.rotation = U3D.v(0, Math.PI / 2, 1);
    this.leftWeaponMesh.position = U3D.v(0);
    this.leftWeaponMesh.origposition = U3D.v(0);

    this.rightWeaponMesh.parent = this.app.rightHandedControllerGrip;
    this.rightWeaponMesh.scaling = U3D.v(0.1);
    this.rightWeaponMesh.rotation = U3D.v(0, Math.PI / 2, 1);
    this.rightWeaponMesh.position = U3D.v(0);
    this.rightWeaponMesh.origposition = U3D.v(0);
  }
  connectGunsNotInXR() {
    this.leftWeaponMesh.parent = this.app.scene.activeCamera;
    this.leftWeaponMesh.scaling = U3D.v(0.55);
    this.leftWeaponMesh.rotation = U3D.v(0, Math.PI / 2 + 0.0105, 0, 0);
    this.leftWeaponMesh.position = U3D.v(-0.5, -1.75, 4);
    this.leftWeaponMesh.origposition = U3D.v(-0.5, -1.75, 4);

    this.rightWeaponMesh.parent = this.app.scene.activeCamera;
    this.rightWeaponMesh.scaling = U3D.v(0.55);
    this.rightWeaponMesh.rotation = U3D.v(0, Math.PI / 2 - 0.0105, 0, 0);
    this.rightWeaponMesh.position = U3D.v(0.5, -1.75, 4);
    this.rightWeaponMesh.origposition = U3D.v(0.5, -1.75, 4);
  }
  async load() {
    let containerPath = '/media/gun.glb';
    let gunModel = await U3D.loadStaticMesh(this.app.scene, containerPath);

    this.leftWeaponMeshInternal = gunModel.clone('leftWeaponMesh');
    this.leftWeaponMeshInternal.setEnabled(true);
    this.leftWeaponMesh = new BABYLON.TransformNode('leftWeaponTN', this.app.scene)
    this.leftWeaponMeshInternal.parent = this.leftWeaponMesh;
    this.leftWeaponMesh.leftWeaponMesh = true;
    this.leftWeaponMesh.u3dRootNode = true;

    this.leftMuzzleTip = new BABYLON.TransformNode('leftMuzzleTip', this.app.scene);
    this.leftMuzzleTip.parent = this.leftWeaponMesh;
    this.leftMuzzleTip.position = U3D.v(-5, 2.15, -0.25);
    this.leftWeaponMesh.muzzleTip = this.leftMuzzleTip;

    this.leftWeaponTip = new BABYLON.TransformNode('leftWeaponTip', this.app.scene);
    this.leftWeaponTip.parent = this.leftWeaponMesh;
    this.leftWeaponTip.position = U3D.v(-2, 2.15, 0);
    this.leftWeaponMesh.weaponTip = this.leftWeaponTip;

    let origin = U3D.v(-0.1, 0, 0);
    let direction = U3D.v(-1, 0, 0);
    let length = 5000;
    let ray = new BABYLON.Ray(origin, direction, length);
    this.leftRayHelper = new BABYLON.RayHelper(ray);
    this.leftRayHelper.attachToMesh(this.leftWeaponTip, origin, direction, length);
    this.leftRayHelper.show(this.app.scene, new BABYLON.Color3(1, 0.5, 0.5));


    this.rightWeaponMeshInternal = gunModel.clone('rightWeaponMeshInternal');
    this.rightWeaponMeshInternal.setEnabled(true);
    this.rightWeaponMesh = new BABYLON.TransformNode('rightWeaponMesh', this.app.scene)
    this.rightWeaponMeshInternal.parent = this.rightWeaponMesh;
    this.rightWeaponMesh.rightWeaponMesh = true;
    this.rightWeaponMesh.u3dRootNode = true;

    this.rightMuzzleTip = new BABYLON.TransformNode('rightMuzzleTip', this.app.scene);
    this.rightMuzzleTip.parent = this.rightWeaponMesh;
    this.rightMuzzleTip.position = U3D.v(-5, 2.15, 0.25);
    this.rightWeaponMesh.muzzleTip = this.rightMuzzleTip;
    this.rightWeaponTip = new BABYLON.TransformNode('rightWeaponTip', this.app.scene);
    this.rightWeaponTip.parent = this.rightWeaponMesh;
    this.rightWeaponTip.position = U3D.v(-2, 2.15, 0);
    this.rightWeaponMesh.weaponTip = this.rightWeaponTip;


    let origin2 = U3D.v(-0.1, 0, 0);
    let direction2 = U3D.v(-1, 0, 0);
    let length2 = 5000;
    let ray2 = new BABYLON.Ray(origin2, direction2, length2);
    this.rightRayHelper = new BABYLON.RayHelper(ray2);
    this.rightRayHelper.attachToMesh(this.rightWeaponTip, origin2, direction2, length2);
    this.rightRayHelper.show(this.app.scene, new BABYLON.Color3(0.5, 0.5, 1));

    const spritemanager = new BABYLON.SpriteManager('sprite-manager', 'media/muzzle.png', 1, 128, this.app.scene)
    spritemanager.renderingGroupId = 1
    const leftSprite = new BABYLON.Sprite('muzzle', spritemanager)
    leftSprite.scaling = U3D.v(0.02);
    leftSprite.isVisible = false
    this.muzzleSprite = leftSprite;

    this.connectGunsNotInXR();
    this.loadAnimations();
  }
  animateShoot(weaponMesh) {
    const frameRate = 60
    const frameTimingShot = [0, 0.05, 0.15, 0.3].map((v) => frameRate * v)
    const shotPositionAnimation = new BABYLON.Animation(
      'shoot-position',
      'position',
      frameRate,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE
    )

    const startPosition = U3D.vector(weaponMesh.origposition);
    const shotPositionKeyFrames = [];

    let leftFactor = 1;
    if (weaponMesh.rightWeaponMesh)
      leftFactor = -1;
    shotPositionKeyFrames.push({
      frame: frameTimingShot[0],
      value: startPosition,
    })
    shotPositionKeyFrames.push({
      frame: frameTimingShot[1],
      value: new BABYLON.Vector3(startPosition.x + leftFactor * 0.1, startPosition.y + 0.2, startPosition.z - 0.7),
    })
    shotPositionKeyFrames.push({
      frame: frameTimingShot[2],
      value: new BABYLON.Vector3(startPosition.x + leftFactor * 0.1, startPosition.y + 0.3, startPosition.z - 1),
    })
    shotPositionKeyFrames.push({
      frame: frameTimingShot[3],
      value: startPosition,
    })
    shotPositionAnimation.setKeys(shotPositionKeyFrames)

    const shotRotationAnimation = new BABYLON.Animation(
      'shoot-rotation',
      'rotation',
      frameRate,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE
    )
    const shotRotationKeyFrames = []

    const startRotation = U3D.vector(weaponMesh.rotation);
    const endRotation = U3D.vector(weaponMesh.rotation);
    shotRotationKeyFrames.push({
      frame: frameTimingShot[0],
      value: startRotation,
    });
    startRotation.addInPlace(U3D.v(leftFactor * -0.12, 0, 0))
    shotRotationKeyFrames.push({
      frame: frameTimingShot[1],
      value: startRotation,
    });
    startRotation.addInPlace(U3D.v(leftFactor * 0.12, 0, 0))
    shotRotationKeyFrames.push({
      frame: frameTimingShot[2],
      value: startRotation,
    });
    shotRotationKeyFrames.push({
      frame: frameTimingShot[3],
      value: endRotation,
    });
    shotRotationAnimation.setKeys(shotRotationKeyFrames);

    const scene = this.app.scene;
    scene.beginDirectAnimation(weaponMesh, [shotPositionAnimation, shotRotationAnimation], 0, 600, false);
  }
  loadAnimations() {
    const animations = this.animations
    // shot
    const frameRate = 60
    const startPosition = U3D.vector(this.leftWeaponMesh.position);

    // shoot

    const frameTimingShot = [0, 0.05, 0.15, 0.3].map((v) => frameRate * v)

    // reload

    const frameTimingReload = [0, 0.2, 1.3, 1.5].map((v) => frameRate * v)
    const reloadPositionAnimation = new BABYLON.Animation(
      'reload-position',
      'position',
      frameRate,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE
    )

    const reloadPositionKeyFrames = []
    reloadPositionKeyFrames.push({
      frame: frameTimingReload[0],
      value: startPosition,
    })
    reloadPositionKeyFrames.push({
      frame: frameTimingReload[1],
      value: new BABYLON.Vector3(startPosition.x + 0.3, startPosition.y - 1.5, startPosition.z),
    })
    reloadPositionKeyFrames.push({
      frame: frameTimingReload[2],
      value: new BABYLON.Vector3(startPosition.x + 0.3, startPosition.y - 1.5, startPosition.z),
    })
    reloadPositionKeyFrames.push({
      frame: frameTimingReload[3],
      value: startPosition,
    })
    reloadPositionAnimation.setKeys(reloadPositionKeyFrames)

    const reloadRotationAnimation = new BABYLON.Animation(
      'reload-rotation',
      'rotation',
      frameRate,
      BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
      BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE
    )
    const reloadRotationKeyFrames = [];
    reloadRotationKeyFrames.push({
      frame: frameTimingReload[0],
      value: new BABYLON.Quaternion(),
    });
    reloadRotationKeyFrames.push({
      frame: frameTimingReload[1],
      value: BABYLON.Quaternion.FromEulerAngles(-0.4, 0, 0),
    });
    reloadRotationKeyFrames.push({
      frame: frameTimingReload[2],
      value: BABYLON.Quaternion.FromEulerAngles(-0.4, 0, 0),
    });
    reloadRotationKeyFrames.push({
      frame: frameTimingReload[3],
      value: new BABYLON.Quaternion(),
    });
    reloadRotationAnimation.setKeys(reloadRotationKeyFrames);

    animations.set('reloadPosition', reloadPositionAnimation);
    animations.set('reloadRotation', reloadRotationAnimation);
  }
  reload() {
    if ((this.status === STATUS.READY || this.status === STATUS.EMPTY) && this.ammo > 0) {
      this.status = STATUS.RELOAD

      // audio

      const audio = this.app.audios.get('reload')
      if (audio.isPlaying === true) {
        audio.stop()
      }
      audio.play()

      // animation

      const reloadPositionAnimation = this.animations.get('reloadPosition')
      const reloadRotationAnimation = this.animations.get('reloadRotation')
      const scene = this.app.scene;
      scene.beginDirectAnimation(this, [reloadPositionAnimation, reloadRotationAnimation], 0, 60, false)

      //

      this.endTimeReload = this.reloadTime
    }

    return this
  }

  shoot(leftGun = true) {
    this.lastShotTime = Date.now();
    let weaponMesh = this.leftWeaponMesh;
    if (!leftGun) {
      weaponMesh = this.rightWeaponMesh;
      if (this.lastShotTime - this.lastRightShot < this.shotCooldown)
        return;
      this.lastRightShot = this.lastShotTime;
    } else {
      if (this.lastShotTime - this.lastLeftShot < this.shotCooldown)
        return;
      this.lastLeftShot = this.lastShotTime;
    }

    if (this.status === STATUS.READY) {
      this.status = STATUS.SHOT

      // audio

      const audio = this.app.audios.get('shot')
      if (audio.isPlaying === true) {
        audio.stop()
      }
      if (this.app.xr)
        audio.attachToMesh(weaponMesh)
      audio.play()

      // animation
      this.animateShoot(weaponMesh);

      // muzzle fire

      this.endTimeMuzzleFire = this.muzzleFireTime

      // create bullet
      const ray = new BABYLON.Ray()

      // first calculate a ray that represents the actual look direction from the head position
      let weaponTip = weaponMesh.weaponTip.getAbsolutePosition();
      ray.origin = U3D.vector(weaponTip);
      ray.length = 10;
      //  ray.direction = weaponMesh.getDirection(BABYLON.Axis.Z);

      let rotation = BABYLON.Quaternion.Identity()
      let p = U3D.v(0);
      weaponMesh.getWorldMatrix().decompose(U3D.v(0), rotation, p)

      let direction = U3D.v(-1, 0, 0);
      let rotMat = BABYLON.Matrix.Zero();
      rotation.toRotationMatrix(rotMat);
      ray.direction = BABYLON.Vector3.TransformCoordinates(direction, rotMat);

      // determine closest intersection point with world object
      const result = this.app.intersectRay(ray, this.intersectionPoint)

      // now calculate the distance to the closest intersection point. if no point was found,
      // choose a point on the ray far away from the origin
      const distance = result === null ? 1000 : ray.origin.distanceTo(intersectionPoint)

      let muzzleTip = weaponMesh.muzzleTip.getAbsolutePosition();
      this.muzzleSprite.position = U3D.vector(muzzleTip);
      this.muzzleSprite.isVisible = true;
      this.muzzleSprite.angle = Math.random() * Math.PI;

      // adjust ammo

      this.roundsLeft--

      this.endTimeShot = this.shotTime

      this.app.activeBullets.push(new Bullet3D(this.app, weaponMesh, ray));

      this.app.updateUI()
    } else if (this.status === STATUS.EMPTY) {
      const audio = this.app.audios.get('empty')
      if (audio.isPlaying === true) {
        audio.stop()
      }
      audio.play()
    }

    return this
  }

  updateFrame() {
    let newLastTime = Date.now();
    let timeElapsed = newLastTime - this.lastShotTime;

    // check reload
    if (timeElapsed >= this.endTimeReload) {
      const toReload = this.roundsPerClip - this.roundsLeft

      if (this.ammo >= toReload) {
        this.roundsLeft = this.roundsPerClip
        this.ammo -= toReload
      } else {
        this.roundsLeft += this.ammo
        this.ammo = 0
      }

      this.status = STATUS.READY

      this.app.updateUI()

      this.endTimeReload = Infinity
    }

    // check muzzle fire

    if (timeElapsed >= this.endTimeMuzzleFire) {
      this.muzzleSprite.isVisible = false
      this.endTimeMuzzleFire = Infinity
    }

    // check shoot
    if (timeElapsed >= this.endTimeShot) {
      if (this.roundsLeft === 0) {
        this.status = STATUS.EMPTY
      } else {
        this.status = STATUS.READY
      }

      this.endTimeShot = Infinity
    }
  }
}

const STATUS = Object.freeze({
  READY: 'ready', // the blaster is ready for the next action
  SHOT: 'shot', // the blaster is firing
  RELOAD: 'reload', // the blaster is reloading
  EMPTY: 'empty', // the blaster is empty
});

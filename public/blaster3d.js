import U3D from '/utility3d.js';

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

    this.endTimeShot = Infinity;
    this.endTimeReload = Infinity;
    this.endTimeMuzzleFire = Infinity;

    const spritemanager = new BABYLON.SpriteManager('sprite-manager', 'media/muzzle.png', 1, 128, this.app.scene)
    spritemanager.renderingGroupId = 1
    const sprite = new BABYLON.Sprite('muzzle', spritemanager)
    sprite.position = new BABYLON.Vector3(0, 0.13, -0.4)
    sprite.scaling = new BABYLON.Vector3(0.3, 0.3, 0.3)
    sprite.isVisible = false
    this.muzzleSprite = sprite;


  }
  async load() {
    let containerPath = '/media/gun.glb';
    let gunModel = await U3D.loadStaticMesh(this.app.scene, containerPath);

    this.leftWeaponMesh = gunModel.clone('leftWeaponMesh');
    this.leftWeaponMesh.parent = this.app.scene.activeCamera;
    this.leftWeaponMesh.scaling = U3D.v(0.55);
    this.leftWeaponMesh.rotation = U3D.v(0, Math.PI / 2, 0, 0);
    this.leftWeaponMesh.position = U3D.v(-0.5, -1.75, 4);
    this.leftWeaponMesh.origposition = U3D.v(-0.5, -1.75, 4);
    this.leftWeaponMesh.setEnabled(true);
    this.leftWeaponMesh.leftWeaponMesh = true;
    this.leftWeaponMesh.u3dRootNode = true;

    this.rightWeaponMesh = gunModel.clone('rightWeaponMesh');
    this.rightWeaponMesh.parent = this.app.scene.activeCamera;
    this.rightWeaponMesh.scaling = U3D.v(0.55);
    this.rightWeaponMesh.rotation = U3D.v(0, Math.PI / 2, 0, 0);
    this.rightWeaponMesh.position = U3D.v(0.5, -1.75, 4);
    this.rightWeaponMesh.origposition = U3D.v(0.5, -1.75, 4);
    this.rightWeaponMesh.setEnabled(true);
    this.rightWeaponMesh.rightWeaponMesh = true;
    this.rightWeaponMesh.u3dRootNode = true;

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
    let weaponMesh = this.leftWeaponMesh;
    if (!leftGun)
      weaponMesh = this.rightWeaponMesh;

    this.lastShotTime = Date.now();
    if (this.status === STATUS.READY) {
      this.status = STATUS.SHOT

      // audio

      const audio = this.app.audios.get('shot')
      if (audio.isPlaying === true) {
        audio.stop()
      }
      audio.play()

      // animation
      this.animateShoot(weaponMesh);

      // muzzle fire

      this.muzzleSprite.isVisible = true
      this.muzzleSprite.angle = Math.random() * Math.PI

      this.endTimeMuzzleFire = this.muzzleFireTime

      // create bullet
      const ray = new BABYLON.Ray()

      // first calculate a ray that represents the actual look direction from the head position
      ray.origin = U3D.vector(weaponMesh.position);

      // determine closest intersection point with world object
      const result = this.app.intersectRay(ray, this.intersectionPoint)

      // now calculate the distance to the closest intersection point. if no point was found,
      // choose a point on the ray far away from the origin
      const distance = result === null ? 1000 : ray.origin.distanceTo(intersectionPoint)

      // now let's change the origin to the weapon's position.
      //this.app.target.copy(ray.origin).add(ray.direction.multiplyScalar(distance))
      //ray.origin.extractPositionFromMatrix(this.worldMatrix)
      ray.origin.x -= 0.25
      ray.origin.y += 1.4
      //ray.direction.subVectors(this.app.target, ray.origin).normalize()
      //  this.app.addBullet(owner, ray)

      this.muzzleSprite.position.x = weaponMesh.position.x - 0.2
      this.muzzleSprite.position.y = weaponMesh.position.y + 0.2
      this.muzzleSprite.position.z = weaponMesh.position.z

      // adjust ammo

      this.roundsLeft--

      this.endTimeShot = this.shotTime

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

    return this
  }
}

const STATUS = Object.freeze({
  READY: 'ready', // the blaster is ready for the next action
  SHOT: 'shot', // the blaster is firing
  RELOAD: 'reload', // the blaster is reloading
  EMPTY: 'empty', // the blaster is empty
});

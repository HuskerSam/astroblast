import U3D from '/utility3d.js';

export default class Blaster3D {
  constructor(app) {
    this.app = app;

    this.position = U3D.v(2, -2, -5);
    this.rotation = new BABYLON.Quaternion(0, 0, 0, 0);

    this.status = STATUS.READY;

    this.animations = new Map();

    this.roundsLeft = 12;
    this.roundsPerClip = 12;
    this.ammo = 48;
    this.maxAmmo = 96;

    // times are in seconds

    this.shotTime = 0.2;
    this.reloadTime = 1.5;
    this.muzzleFireTime = 0.1;

    this.currentTime = 0;
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

    this.ui = {
      //      roundsLeft: document.getElementById('roundsLeft'),
      //      ammo: document.getElementById('ammo'),
    }

    this.loadAnimations();
  }
  async load() {
    const gunMeshes = (await BABYLON.SceneLoader.ImportMeshAsync(null, '/media/', 'gun.glb', this.scene)).meshes;
    this.weaponMesh = gunMeshes[1];
    this.weaponMesh.parent = this.app.scene.activeCamera;
    this.weaponMesh.scaling = U3D.v(0.55);
    this.weaponMesh.rotation = U3D.v(-Math.PI / 2, 0, Math.PI / 2);
    this.weaponMesh.position = U3D.v(0, -1.5, 4);

/*
    const gunMesh = gunMeshes.find((m) => m.name === 'BaseMesh.001')
    gunMesh.scaling = new BABYLON.Vector3(0.6, 0.6, 0.6)
    gunMesh.position = new BABYLON.Vector3(0, 0, 0.4)
    gunMesh.rotation = new BABYLON.Vector3(0, 0, Math.PI / 2)
    gunMesh.bakeCurrentTransformIntoVertices()
    gunMesh.renderingGroupId = 2
    gunMesh.freezeWorldMatrix()
    gunMesh.alwaysSelectAsActiveMesh = true
    */
  }
  loadAnimations() {
    const animations = this.animations
    // shot
    const frameRate = 1

    // shoot

    const frameTimingShot = [0, 0.05, 0.15, 0.3].map((v) => frameRate * v)
    const shotPositionAnimation = new BABYLON.Animation(
      'shoot-position',
      'position',
      frameRate,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE
    )

    const startPosition = new BABYLON.Vector3(this.position.x, this.position.y, this.position.z)
    const shotPositionKeyFrames = []
    shotPositionKeyFrames.push({
      frame: frameTimingShot[0],
      value: startPosition,
    })
    shotPositionKeyFrames.push({
      frame: frameTimingShot[1],
      value: new BABYLON.Vector3(startPosition.x + 0.6, startPosition.y + 0.4, startPosition.z + 1.4),
    })
    shotPositionKeyFrames.push({
      frame: frameTimingShot[2],
      value: new BABYLON.Vector3(startPosition.x + 0.6, startPosition.y + 0.61, startPosition.z + 2),
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
      BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
      BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE
    )
    const shotRotationKeyFrames = []

    shotRotationKeyFrames.push({
      frame: frameTimingShot[0],
      value: new BABYLON.Quaternion(this.rotation.x, this.rotation.y, this.rotation.z, this.rotation.w),
    })
    shotRotationKeyFrames.push({
      frame: frameTimingShot[1],
      value: BABYLON.Quaternion.FromEulerAngles(-0.12, 0, 0),
    })
    shotRotationKeyFrames.push({
      frame: frameTimingShot[2],
      value: BABYLON.Quaternion.FromEulerAngles(0.12, 0, 0),
    })
    shotRotationKeyFrames.push({
      frame: frameTimingShot[3],
      value: new BABYLON.Quaternion(),
    })
    shotRotationAnimation.setKeys(shotRotationKeyFrames)

    animations.set('shootPosition', shotPositionAnimation)
    animations.set('shootRotation', shotRotationAnimation)

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

      this.endTimeReload = this.currentTime + this.reloadTime
    }

    return this
  }

  shoot() {
    if (this.status === STATUS.READY) {
      this.status = STATUS.SHOT

      // audio

      const audio = this.app.audios.get('shot')
      if (audio.isPlaying === true) {
        audio.stop()
      }
      audio.play()

      // animation

      const shootPositionAnimation = this.animations.get('shootPosition')
      const shootRotationAnimation = this.animations.get('shootRotation')
      const scene = this.app.scene;
      scene.beginDirectAnimation(this, [shootPositionAnimation, shootRotationAnimation], 0, 60, false)

      // muzzle fire

      this.muzzleSprite.isVisible = true
      this.muzzleSprite.angle = Math.random() * Math.PI

      this.endTimeMuzzleFire = this.currentTime + this.muzzleFireTime

      // create bullet
      const ray = new BABYLON.Ray()

      // first calculate a ray that represents the actual look direction from the head position
      ray.origin.extractPositionFromMatrix(head.worldMatrix)

      // determine closest intersection point with world object
      const result = U3D.intersectRay(ray, intersectionPoint)

      // now calculate the distance to the closest intersection point. if no point was found,
      // choose a point on the ray far away from the origin
      const distance = result === null ? 1000 : ray.origin.distanceTo(intersectionPoint)

      // now let's change the origin to the weapon's position.
      target.copy(ray.origin).add(ray.direction.multiplyScalar(distance))
      ray.origin.extractPositionFromMatrix(this.worldMatrix)
      ray.origin.x -= 0.25
      ray.origin.y += 1.4
      ray.direction.subVectors(target, ray.origin).normalize()
      this.app.addBullet(owner, ray)

      this.muzzleSprite.position.x = ray.origin.x - 0.2
      this.muzzleSprite.position.y = ray.origin.y + 0.2
      this.muzzleSprite.position.z = ray.origin.z

      // adjust ammo

      this.roundsLeft--

      this.endTimeShot = this.currentTime + this.shotTime

      this.app.updateUI()
    } else if (this.status === STATUS.EMPTY) {
      const audio = world.audios.get('empty')
      if (audio.isPlaying === true) {
        audio.stop()
      }
      audio.play()
    }

    return this
  }

  updateFrame(timeDelta) {
    this.currentTime += delta

    // check reload
    if (this.currentTime >= this.endTimeReload) {
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

    if (this.currentTime >= this.endTimeMuzzleFire) {
      this.muzzleSprite.isVisible = false

      this.endTimeMuzzleFire = Infinity
    }

    // check shoot

    if (this.currentTime >= this.endTimeShot) {
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
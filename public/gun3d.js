import U3D from '/utility3d.js';
import * as YUKA from './fps/yuka.module.js'
import { Blaster } from './fps/Blaster.js'

export default class Gun3D {
  constructor(app) {
    this.app = app;
    this.app.audios = new Map();
    this.app.models = new Map();
  }
  async init() {
    this._loadAudios();
    await this._loadModels();
  }
  _loadAudios() {
    const audios = this.app.audios

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
  async _loadModels() {
    const models = this.app.models

    // target
    const targetMeshes = (await BABYLON.SceneLoader.ImportMeshAsync(null, '/media/', 'target.glb', this.scene)).meshes
    const gunMeshes = (await BABYLON.SceneLoader.ImportMeshAsync(null, '/media/', 'gun.glb', this.scene)).meshes

    targetMeshes[0].name = 'target'
    const targetMesh = targetMeshes.find((m) => m.name === 'LowPoly.003__0')
    targetMesh.rotation = new BABYLON.Vector3(-3 * Math.PI/2, Math.PI / 2, Math.PI)
    targetMesh.position = new BABYLON.Vector3(-20, -5, -2);
    targetMeshes[0].scaling = new BABYLON.Vector3(0.01, 0.01, 0.01)
    targetMesh.bakeCurrentTransformIntoVertices()
    targetMesh.renderingGroupId = 2
    targetMesh.freezeWorldMatrix()
    targetMesh.alwaysSelectAsActiveMesh = true
    targetMesh.parent = null

    // weapon
    gunMeshes[0].name = 'gun';
    this.gunMesh = gunMeshes[0];
    const gunMesh = gunMeshes.find((m) => m.name === 'BaseMesh.001')
    // gunMesh.parent = null

    const spritemanager = new BABYLON.SpriteManager('sprite-manager', '/media/muzzle.png', 1, 128, this.scene)
    spritemanager.renderingGroupId = 1
    const sprite = new BABYLON.Sprite('muzzle', spritemanager)
    sprite.position = new BABYLON.Vector3(0, 0.13, -0.4)
    sprite.scaling = new BABYLON.Vector3(0.3, 0.3, 0.3)
    sprite.isVisible = false

    models.set('target', targetMesh)
    models.set('weapon', gunMesh)
    models.set('muzzle', sprite)

    // bullet hole
    const texture = new BABYLON.Texture('/media/bulletHole.png', this.scene)
    texture.hasAlpha = true
    const bulletHoleMesh = BABYLON.MeshBuilder.CreatePlane('bullet-hole', { size: 0.5 }, this.scene)
    bulletHoleMesh.rotation = new BABYLON.Vector3(0, Math.PI, 0)
    const bulletHoleMaterial = new BABYLON.StandardMaterial('bullet-hole', this.scene)
    bulletHoleMaterial.diffuseTexture = texture
    bulletHoleMesh.material = bulletHoleMaterial
    bulletHoleMesh.renderingGroupId = 3
    bulletHoleMesh.bakeCurrentTransformIntoVertices()
    bulletHoleMesh.setEnabled(false)
    models.set('bulletHole', bulletHoleMesh)

    // bullet line
    const options = {
      points: [new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0, 10)],
    }
    const bulletLine = BABYLON.MeshBuilder.CreateLines('bullet-line', options, this.scene)
    bulletLine.color = new BABYLON.Color3.FromHexString('#fbf8e6')
    bulletLine.setEnabled(false)
    bulletLine.renderingGroupId = 3
    bulletLine.freezeWorldMatrix()
    models.set('bulletLine', bulletLine)
  }
}

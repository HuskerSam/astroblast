import U3D from '/utility3d.js';

export default class Bullet3D {
  constructor(app, weaponMesh, ray) {
    this.app = app
    this.ray = ray
    this.weaponMesh = weaponMesh;

    this.lastShotTime = Date.now();
    this.intersectionPoint = U3D.v(0);
    this.normal = U3D.v(0);
    this.currentRay = new BABYLON.Ray(ray.origin, ray.direction, ray.length);

    this.maxSpeed = 40 // 40 m/s

    this.origPosition = U3D.vector(ray.origin);
    this.velocity = ray.direction.normalizeToNew().multiplyByFloats(0.5, 0.5, 0.5);

    const s = 1 + Math.random() * 3 // scale the shot line a bit

    this.lifetime = 3000

    this.currentTime = 0;

    this.sceneBullet = BABYLON.MeshBuilder.CreateSphere("scenebullet", {
      diameter: 0.5,
      segments: 4
    }, this.app.scene);
    this.sceneBullet.position = U3D.vector(this.origPosition);
    this.sceneBullet.material = new BABYLON.StandardMaterial("sceneBullet", this.app.scene);
    let color = new BABYLON.Color3(1, 0, 0);
    if (this.weaponMesh.rightWeaponMesh) {
      this.sceneBullet.isBlue = true;
      color = new BABYLON.Color3(0, 0, 1);
    }
    this.sceneBullet.material.diffuseColor = color;
    this.sceneBullet.material.emissiveColor = color;
  }
  dispose() {
    if (this.sceneBullet)
      this.sceneBullet.dispose();
    if (this.asteroidMesh)
      this.asteroidMesh.dispose();
  }

  updateFrame() {
    let newLastTime = Date.now();
    let timeElapsed = newLastTime - this.lastShotTime;

    if (!this.beenHit) {
      this.sceneBullet.position.x += this.velocity.x;
      this.sceneBullet.position.y += this.velocity.y;
      this.sceneBullet.position.z += this.velocity.z;
    }

    if (timeElapsed > this.lifetime) {
      this.app.removeBullet(this);
    }
  }
  async hitObstacle(particle, position, rotation, asteroidName) {
    this.beenHit = true;
    this.sceneBullet.material.wireframe = true;

    let asteroid = this.app.collisionHelper.rawAsteroidMeshes[asteroidName];
    asteroid.setEnabled(true);

    let push = this.ray.direction.normalizeToNew().multiplyByFloats(10, 10, 10);

    asteroid.position = position;
    asteroid.position.addInPlace(push);

    asteroid.rotation = rotation;
    this.asteroidMesh = asteroid;

    if (this.sceneBullet.isBlue)
      asteroid.material = this.app.blueHitShaderMaterial;
    else
      asteroid.material = this.app.redHitShaderMaterial;
    /*
    this.sceneBullet.material = new BABYLON.StandardMaterial('hitcolor', this.app.scene);
    this.sceneBullet.material.diffuseColor = new BABYLON.Color3(0, 1, 0);
    this.sceneBullet.material.emissiveColor = new BABYLON.Color3(0, 1, 0);
    */
    this.sceneBullet.material.wireframe = true;
    this.sceneBullet.position.addInPlace(push);

    let impactName = (this.sceneBullet.isBlue) ? 'impact1' : 'impact2';
    const audio = this.app.audios.get(impactName);

    if (audio.isPlaying === true) {
      audio.stop()
    }
    if (this.xr)
      audio.attachToMesh(this.sceneBullet);
    audio.play()

    let scaling = asteroid.scaling.x;
    this.sceneBullet.setEnabled(false);
    let interval = setInterval(() => {
      scaling *= 0.98;
      asteroid.scaling = U3D.v(scaling);
      //  this.sceneBullet.scaling = U3D.v(scaling);
    }, 10);
    setTimeout(() => {
      this.app.removeBullet(this);
      clearInterval(interval);
    }, 800);
  }
}

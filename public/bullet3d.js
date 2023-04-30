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
      segments: 8
    }, this.app.scene);
    this.sceneBullet.position = U3D.vector(this.origPosition);
    this.sceneBullet.material = new BABYLON.StandardMaterial("sceneBullet", this.app.scene);
    let color =  new BABYLON.Color3(1, 0, 0);
    if (this.weaponMesh.rightWeaponMesh)
      color = new BABYLON.Color3(0, 0, 1);
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

    let asteroid = await this.app.asteroidHelper.loadAsteroid(asteroidName, this.app.collisionHelper.particleRadius * 4);

    let push = this.ray.direction.normalizeToNew().multiplyByFloats(10, 10, 10);

    asteroid.position = position;
    asteroid.position.addInPlace(push);

    asteroid.rotation = rotation;
    this.asteroidMesh = asteroid;

    asteroid.material = this.sceneBullet.material;
    this.sceneBullet.material = new BABYLON.StandardMaterial('hitcolor', this.app.scene);
    this.sceneBullet.material.wireframe = true;
    this.sceneBullet.material.diffuseColor = new BABYLON.Color3(0, 1, 0);
    this.sceneBullet.material.emissiveColor = new BABYLON.Color3(0, 1, 0);
    this.sceneBullet.position.addInPlace(push);

    const audio = this.app.audios.get('impact' + (Math.floor(Math.random () * 5) + 1).toString());

    if (audio.isPlaying === true) {
      audio.stop()
    }
    audio.attachToMesh(this.sceneBullet);
    audio.play()

    setTimeout(() => {
      this.app.removeBullet(this);
    }, 500);
  }
}

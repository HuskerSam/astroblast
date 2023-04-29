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
      diameter: 0.5
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
    this.sceneBullet.dispose();
  }

  updateFrame() {
    let newLastTime = Date.now();
    let timeElapsed = newLastTime - this.lastShotTime;

    if (!this.stopMotion) {
      this.sceneBullet.position.x += this.velocity.x;
      this.sceneBullet.position.y += this.velocity.y;
      this.sceneBullet.position.z += this.velocity.z;
    }

    if (timeElapsed > this.lifetime) {
      this.app.removeBullet(this);
    }
  }
  hitObstacle(particle, hitDetails) {
    this.stopMotion = true;
    setTimeout(() => {
      this.app.removeBullet(this);
    }, 500);
  }
}

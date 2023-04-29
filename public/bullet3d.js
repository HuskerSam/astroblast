import U3D from '/utility3d.js';

export default class Bullet3D {
  constructor(app, ray = new Ray()) {
    this.app = app
    this.ray = ray

    this.intersectionPoint = U3D.v(0);
    this.normal = U3D.v(0);
    this.currentRay = new BABYLON.Ray(ray.origin, ray.direction, ray.length);

    this.maxSpeed = 40 // 40 m/s

    this.position.copy(ray.origin)
    this.velocity.copy(ray.direction).multiplyScalar(this.maxSpeed)

    const s = 1 + Math.random() * 3 // scale the shot line a bit

    this.lifetime = 100
    this.currentTime = 0
  }

  updateFrame(timeDelta) {
    this.currentTime += timeDelta

    if (this.currentTime > this.lifetime) {
      world.remove(this)
    } else {
      this.currentRay.copy(this.ray)
      this.currentRay.origin.copy(this.position)
      super.update(delta)

      const entity = world.intersectRay(this.currentRay, this.intersectionPoint, this.normal)

      if (entity !== null && entity.name === 'target') {
        // calculate distance from origin to intersection point
        const distanceToIntersection = this.currentRay.origin.squaredDistanceTo(this.intersectionPoint)
        const validDistance = this.currentRay.origin.squaredDistanceTo(this.position)

        if (distanceToIntersection <= validDistance) {
          // hit!
          const audio = this.app.audios.get('impact' + MathUtils.randInt(1, 5))

          if (audio.isPlaying === true) {
            audio.stop()
          }
          audio.play()

          // inform game entity about hit
          this.app.sendMessage('hit', entity)

          // add visual feedback
          this.app.addBulletHole(this.intersectionPoint, this.normal, audio)

          // remove bullet from world
          this.app.removeBullet(this)
        }
      }
    }

    return this
  }
}

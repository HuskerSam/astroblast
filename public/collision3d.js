import U3D from '/utility3d.js';
const epsilon = 0.00001;

export default class Collision3D {
  constructor(app, count) {
    this.app = app;
    //Base particle
    this.particleRadius = 1;
    this.particleSpeedX = 0.25 * Math.random() * this.particleRadius;
    this.particleSpeedY = 0.25 * Math.random() * this.particleRadius;
    this.particleSpeedZ = 0.25 * Math.random() * this.particleRadius;

    this.asteroidCount = count;

    this.sphereRadius = this.app.environmentRadius;
    this.innerSize = this.sphereRadius - 2 * this.particleRadius;
  }
  async init() {
    let scene = this.app.scene;

    let SPS = new BABYLON.SolidParticleSystem('SPS', scene, {
      particleIntersection: true,
      useModelMaterial: true
      //   updatable: false
    });
    let promises = [];
    let loadAsteroid = async (SPSystem, index) => {
      let asteroidNameIndex = this.app.asteroidHelper.randomArray[index];
      let asteroidName = this.app.asteroidHelper.asteroidsNameList[asteroidNameIndex];
      let asteroid = await this.app.asteroidHelper.loadAsteroid(asteroidName, this.particleRadius * 4);
    //console.log(asteroid);
      SPSystem.addShape(asteroid, 1);
      asteroid.dispose();
    };

    for (let c = 0; c < this.asteroidCount; c++) {
      promises.push(loadAsteroid(SPS, c));
    }
    await Promise.all(promises);

    let mesh = SPS.buildMesh();
    SPS.isAlwaysVisible = true;

    let sq = 0; // quadratic b^2 - 4ac
    let sqroot = 0; // root of b^2 - 4ac
    let t = 0; //time to collision

    // SPS initialization
    SPS.initParticles = () => {
      for (let p = 0; p < SPS.nbParticles; p++) {
        let x = this.innerSize - 2 * this.innerSize * Math.random();
        let y = this.innerSize - 2 * this.innerSize * Math.random();
        let z = this.innerSize - 2 * this.innerSize * Math.random();

        SPS.particles[p].position = new BABYLON.Vector3(x, y, z);
        SPS.particles[p].direction = new BABYLON.Vector3(Math.floor(2.99 * Math.random()) - 1, Math.floor(2.99 * Math.random()) - 1, Math.floor(2.99 * Math.random()) - 1);
        SPS.particles[p].velocity = new BABYLON.Vector3(this.particleSpeedX * SPS.particles[p].direction.x, this.particleSpeedY * SPS.particles[p].direction.y, this.particleSpeedZ * SPS.particles[p].direction.z);
      }
    };

    SPS.updateParticle = (particle) => {
      for (let p = particle.idx + 1; p < SPS.nbParticles; p++) {
        let q = SPS.particles[p];
        let dx = particle.position.x - q.position.x;
        let dy = particle.position.y - q.position.y;
        let dz = particle.position.z - q.position.z;
        let dx2 = dx * dx;
        let dy2 = dy * dy;
        let dz2 = dz * dz;
        let dl2 = dx2 + dy2 + dz2;

        let vx = particle.velocity.x - q.velocity.x;
        let vy = particle.velocity.y - q.velocity.y;
        let vz = particle.velocity.z - q.velocity.z;
        let vx2 = vx * vx;
        let vy2 = vy * vy;
        let vz2 = vz * vz;
        let vl2 = vx2 + vy2 + vz2;

        let vdotd = dx * vx + dy * vy + dz * vz;

        let sq = 4 * vdotd * vdotd - 4 * vl2 * (dl2 - 4 * this.particleRadius * this.particleRadius);

        if (vdotd < 0 && sq > 0) {
          let sqroot = Math.sqrt(sq);
          let t = (-2 * vdotd - sqroot) / (2 * vl2);
          if (0 < t && t <= 1) {

            //new velocity
            dx += vx;
            dy += vy;
            dz += vz;
            dx2 = dx * dx;
            dy2 = dy * dy;
            dz2 = dz * dz;
            dl2 = dx2 + dy2 + dz2;
            if (dl2 == 0) {
              dl2 = 1;
            }
            let dl = Math.sqrt(dl2);
            let nx = dx / dl;
            let ny = dy / dl;
            let nz = dz / dl;

            let vdotn = nx * vx + ny * vy + nz * vz;

            particle.velocity.x -= vdotn * nx;
            particle.velocity.y -= vdotn * ny;
            particle.velocity.z -= vdotn * nz;
            q.velocity.x += vdotn * nx;
            q.velocity.y += vdotn * ny;
            q.velocity.z += vdotn * nz;

            //position correction
            particle.position.x += vdotn * nx * t;
            particle.position.y += vdotn * ny * t;
            particle.position.z += vdotn * nz * t;
            q.position.x -= vdotn * nx * t;
            q.position.y -= vdotn * ny * t;
            q.position.z -= vdotn * nz * t;
          }
        }
      }


      let nextx = particle.position.x + particle.velocity.x;
      let nexty = particle.position.y + particle.velocity.y;
      let nextz = particle.position.z + particle.velocity.z;

      let nextRadius = Math.sqrt(nextx * nextx + nexty * nexty + nextz * nextz);

      if (nextRadius > this.sphereRadius) {

        /*
        particle.velocity.x *= -1;
        particle.velocity.y *= -1;
        particle.velocity.z *= -1;
        */
        particle.position.x -= 4 * particle.velocity.x;
        particle.position.y -= 4 * particle.velocity.y;
        particle.position.z -= 4 * particle.velocity.z;

        particle.position.x *= -1;
        particle.position.y *= -1;
        particle.position.z *= -1;

        /*
        if (particle.position.x > 0)
          particle.position.x -= 2;
        else
          particle.position.x += 2;

        if (particle.position.y > 0)
          particle.position.y -= 2;
        else
          particle.position.y += 2;

        if (particle.position.z > 0)
          particle.position.z -= 2;
        else
          particle.position.z += 2;

*/
      }

      /*

            if (nextx - (-this.sphereRadius) <= (1 + epsilon) * this.particleRadius && particle.velocity.x < 0 ||
              this.sphereRadius - nextx < (1 + epsilon) * this.particleRadius && particle.velocity.x > 0) {
              if (particle.velocity.x < 0) {
                particle.position.x = 2 * wallLeft.position.x - particle.position.x + 2 * this.particleRadius;
              } else {
                particle.position.x = 2 * wallRight.position.x - particle.position.x - 2 * this.particleRadius;
              }
              particle.velocity.x *= -1;
            }

            if (nexty - (-this.sphereRadius) <= (1 + epsilon) * this.particleRadius && particle.velocity.y < 0 ||
              this.sphereRadius - nexty < (1 + epsilon) * this.particleRadius && particle.velocity.y > 0) {
              if (particle.velocity.y < 0) {
                particle.position.y = 2 * ground.position.y - particle.position.y + 2 * this.particleRadius;
              } else {
                particle.position.y = 2 * roof.position.y - particle.position.y - 2 * this.particleRadius;
              }
              particle.velocity.y *= -1;
            }

            if (nextz - (-this.sphereRadius) <= (1 + epsilon) * this.particleRadius && particle.velocity.z < 0 ||
              this.sphereRadius - nextz < (1 + epsilon) * this.particleRadius && particle.velocity.z > 0) {
              if (particle.velocity.z < 0) {
                particle.position.z = 2 * wallFront.position.z - particle.position.z + 2 * this.particleRadius;
              } else {
                particle.position.z = 2 * wallBack.position.z - particle.position.z - 2 * this.particleRadius;
              }
              particle.velocity.z *= -1;
            }
      */
      particle.position.x += particle.velocity.x;
      particle.position.y += particle.velocity.y;
      particle.position.z += particle.velocity.z;

    }

    SPS.initParticles();
    scene.registerAfterRender(() => {
      SPS.setParticles();
    });
  }
}

import U3D from '/utility3d.js';
const epsilon = 0.00001;

export default class Collision3D {
  constructor(app, count) {
    this.app = app;
    //Base particle
    this.particleRadius = 1;
    this.particleMin = 0.05;
    this.particleMax = 0.5;
    this.particleSpeed = Math.min(this.particleMax, Math.max(this.particleMin, Math.random() * (this.particleMax + this.particleMin)));
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
        let vRandom = U3D.v(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        let direction = vRandom.normalizeToNew();
        SPS.particles[p].velocity = U3D.v(this.particleSpeed * direction.x, this.particleSpeed * direction.y, this.particleSpeed * direction.z);
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

            U3D.amplitudeRange(q.velocity, this.particleMin, this.particleMax);
            U3D.amplitudeRange(particle.velocity,  this.particleMin, this.particleMax);

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
        let vecRaw = particle.velocity.normalizeToNew();
        let vecIdeal = particle.position.normalizeToNew();
        let vec2 = vecRaw.add(vecIdeal);
        let directionRaw = U3D.v(vec2.x / 2.0, vec2.y / 2.0, vec2.z / 2.0);
        let vDirection = directionRaw.normalizeToNew();

        let vel = particle.velocity;
        let vAmplitude = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);

        particle.velocity.x = vAmplitude * vDirection.x;
        particle.velocity.y = vAmplitude * vDirection.y;
        particle.velocity.z = vAmplitude * vDirection.z;

        particle.position.x *= -1;
        particle.position.y *= -1;
        particle.position.z *= -1;

        let nudgeSize = 5;
        particle.position.x += nudgeSize * vecIdeal.x;
        particle.position.y += nudgeSize * vecIdeal.y;
        particle.position.z += nudgeSize * vecIdeal.z;
      }

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

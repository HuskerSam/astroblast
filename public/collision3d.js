import U3D from '/utility3d.js';

export default class Collision3D {
  constructor(app, count) {
    this.app = app;
    //Base particle
    this.particleRadius = 1;
    this.particleMin = 0.025;
    this.particleMax = 0.4;
    this.asteroidCount = count;

    this.sphereRadius = this.app.environmentRadius;
    this.innerSize = this.sphereRadius - 2 * this.particleRadius;
  }
  async loadAsteroid(index, modFactor = null) {
    let asteroidNameIndex = this.app.asteroidHelper.randomArray[index];
    let asteroidName = this.app.asteroidHelper.asteroidsNameList[asteroidNameIndex];
    let asteroid = await this.app.asteroidHelper.loadAsteroid(asteroidName, this.particleRadius * 4);
    //console.log(asteroid);
    if (modFactor !== null) {
      if (index % modFactor === 0)
      asteroid.material = this.app.asteroidHelper.asteroidMaterialRed;
      if (index % modFactor === 1)
      asteroid.material = this.app.asteroidHelper.asteroidMaterialBlue;
    }

    let shapeId = this.SPS.addShape(asteroid, 1);
    this.asteroidNames[shapeId] = asteroidName;
    this.rawAsteroidMeshes[asteroidName] = asteroid.clone();
    this.rawAsteroidMeshes[asteroidName].setEnabled(false);

    asteroid.dispose(true, false);
  }
  async init() {
    let scene = this.app.scene;

    if (this.SPS) {
      this.SPS.dispose();
      this.SPS = null;
    }

    let SPS = new BABYLON.SolidParticleSystem('SPS', scene, {
      particleIntersection: true,
      useModelMaterial: true
    });
    this.SPS = SPS;
    if (!this.SPSRenderRegistered) {
      this.SPSRenderRegistered = true;
      scene.registerAfterRender(() => {
        if (this.SPS)
          this.SPS.setParticles();
      });
    }

    this.asteroidNames = {};
    this.rawAsteroidMeshes = {};

    this.SPS.updateParticle = (particle) => {
      if (particle.beenHit || !this.SPS)
        return;
      for (let p = particle.idx + 1; p < this.SPS.nbParticles; p++)
        this.detectParticleCollision(particle, this.SPS.particles[p]);

      this.detectBoundaryCollision(particle);

      let delta = this._nextLocationDelta(particle);
      particle.position.addInPlace(delta.position);
      particle.rotation.addInPlace(delta.rotation);

      this.app.checkForBulletHit(particle);
    }

    if (this.app.roundType === "2")
      await this.initRoundType2Particles();
    else
      await this.initRoundType1Particles();

    let mesh = this.SPS.buildMesh();
    this.SPS.isAlwaysVisible = true;
  }
  _nextLocationDelta(particle) {
    if (particle.motionType === 'free')
      return {
        position: particle.velocity,
        rotation: particle.rotationVelocity
      }

    if (particle.motionType === 'orbitable') {
      particle.orbitRotation += particle.orbitVelocity;
      let x = particle.amplitude * Math.cos(particle.orbitRotation);
      let z = particle.amplitude * Math.sin(particle.orbitRotation);
      x -= particle.position.x;
      z -= particle.position.z;
      return {
        position: U3D.v(x, 0, z),
        rotation: particle.rotationVelocity
      }
    }

    return {
      position: U3D.v(0),
      rotation: particle.rotationVelocity
    }
  }
  detectBoundaryCollision(particle) {
    let positionDelta = this._nextLocationDelta(particle);
    let nextx = particle.position.x + positionDelta.position.x;
    let nexty = particle.position.y + positionDelta.position.y;
    let nextz = particle.position.z + positionDelta.position.z;

    let nextRadius = Math.sqrt(nextx * nextx + nexty * nexty + nextz * nextz);

    if (nextRadius > this.sphereRadius) {
      let vecRaw = particle.velocity.normalizeToNew();
      let vecIdeal = particle.position.normalizeToNew();
      let vec2 = vecRaw.add(vecIdeal);
      let directionRaw = U3D.v(vec2.x * 0.5, vec2.y * 0.5, vec2.z * 0.5);
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
  }
  _particleMotionRandom(particle) {
    if (particle.motionType === 'free')
      return;
    if (particle.motionType === 'orbitable') {
      let direction = this._nextLocationDelta(particle).position.normalizeToNew();
      let yFactor = (Math.random() - 0.5) * 0.5;
      direction.y = yFactor;
      direction = direction.normalizeToNew();
      particle.motionType = 'free';

      let particleSpeed = this.particleMin + Math.random() * (this.particleMax - this.particleMin);
      particle.velocity = U3D.v(particleSpeed * direction.x, particleSpeed * direction.y, particleSpeed * direction.z);

      console.log('motion change collision', particle.velocity);
    }
  }
  detectParticleCollision(particle, q) {
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

    let sq = 4 * vdotd * vdotd - 4 * vl2 * (dl2 - 2 * this.particleRadius * this.particleRadius);

    if (vdotd < 0 && sq > 0) {
      this._particleMotionRandom(particle);
      this._particleMotionRandom(q);
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
        U3D.amplitudeRange(particle.velocity, this.particleMin, this.particleMax);

        //position correction
        particle.position.x += vdotn * nx * t;
        particle.position.y += vdotn * ny * t;
        particle.position.z += vdotn * nz * t;
        q.position.x -= vdotn * nx * t;
        q.position.y -= vdotn * ny * t;
        q.position.z -= vdotn * nz * t;

        particle.rotationVelocity.x *= -1;
        particle.rotationVelocity.y *= -1;
        particle.rotationVelocity.z *= -1;

        q.rotationVelocity.x *= -1;
        q.rotationVelocity.y *= -1;
        q.rotationVelocity.z *= -1;
      }
    }
  }
  _initRandomParticle(particle) {
    particle.motionType = 'free';

    let x = this.innerSize - (2 * this.innerSize * Math.random());
    let y = this.innerSize - (2 * this.innerSize * Math.random());
    let z = this.innerSize - (2 * this.innerSize * Math.random());

    particle.position = new BABYLON.Vector3(x, y, z);
    let vRandom = U3D.v(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);

    let direction = vRandom.normalizeToNew();
    let particleSpeed = this.particleMin + Math.random() * (this.particleMax - this.particleMin);
    particle.velocity = U3D.v(particleSpeed * direction.x, particleSpeed * direction.y, particleSpeed * direction.z);

    let rotX = (Math.random() - 0.5) / 20.0;
    let rotY = (Math.random() - 0.5) / 20.0;
    let rotZ = (Math.random() - 0.5) / 20.0;
    particle.rotationVelocity = U3D.v(rotX, rotY, rotZ);
  }
  _initOrbitableParticle(particle, amplitude, orbitStart, orbitVelocity, orbitIndex, orbitCount) {
    let orbitRotation = (orbitIndex / orbitCount) * 2 * Math.PI + orbitStart;
    particle.orbitVelocity = orbitVelocity;
    particle.orbitRotation = orbitRotation;
    particle.amplitude = amplitude;

    particle.motionType = 'orbitable';
    let x = amplitude * Math.cos(particle.orbitRotation);
    let y = 0;
    let z = amplitude * Math.sin(particle.orbitRotation);

    particle.position = new BABYLON.Vector3(x, y, z);

    let rotX = (Math.random() - 0.5) / 20.0;
    let rotY = (Math.random() - 0.5) / 20.0;
    let rotZ = (Math.random() - 0.5) / 20.0;
    particle.rotationVelocity = U3D.v(rotX, rotY, rotZ);
  }
  async initRoundType1Particles() {
    let promises = [];
    for (let c = 0; c < this.asteroidCount; c++) {
      promises.push(this.loadAsteroid(c, 15));
    }
    await Promise.all(promises);

    for (let p = 0; p < this.SPS.nbParticles; p++) {
      let particle = this.SPS.particles[p];
      this._initRandomParticle(particle);
    }

  }
  async initRoundType2Particles() {
    let promises = [];
    for (let c = 0; c < 30; c++) {
      promises.push(this.loadAsteroid(c));
    }
    await Promise.all(promises);

    promises = [];
    for (let c = 0; c < 4; c++) {
      promises.push(this.loadAsteroid(c, 2));
    }
    await Promise.all(promises);

    let orbitCount = 10;
    let amplitude = 10;
    let orbitStart = Math.random() * Math.PI * 2;
    let orbitVelocity = 0.01;
    for (let p = 0; p < orbitCount; p++) {
      let particle = this.SPS.particles[p];
      this._initOrbitableParticle(particle, amplitude, orbitStart, orbitVelocity, p, orbitCount);
    }

    amplitude = 15;
    orbitStart = Math.random() * Math.PI * 2;
    orbitVelocity = -0.008;
    for (let p = 10; p < 10 + orbitCount; p++) {
      let particle = this.SPS.particles[p];
      this._initOrbitableParticle(particle, amplitude, orbitStart, orbitVelocity, p, orbitCount);
    }

    amplitude = 20;
    orbitStart = Math.random() * Math.PI * 2;
    orbitVelocity = 0.006;
    for (let p = 20; p < 20 + orbitCount; p++) {
      let particle = this.SPS.particles[p];
      this._initOrbitableParticle(particle, amplitude, orbitStart, orbitVelocity, p, orbitCount);
    }

    for (let p = 30; p < 34 ; p++) {
      let particle = this.SPS.particles[p];
      this._initRandomParticle(particle);
    }
  }
}

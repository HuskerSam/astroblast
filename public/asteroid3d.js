import U3D from '/utility3d.js';

export default class Asteroid3D {
  constructor(app) {
    this.app = app;
    this.asteroidOrbitFrameCount = 300000 / 1000 * 60;
    this.asteroidMaterial = new BABYLON.StandardMaterial('asteroidMaterial', this.app.scene);
    this.selectedAsteroidMaterial = new BABYLON.StandardMaterial('selectedAsteroidMaterial', this.app.scene);

    this.asteroidMaterial.wireframe = true;
  //  this.asteroidMaterial.disableLighting = true
  //  this.selectedAsteroidMaterial.disableLighting = true
    let t11 = new BABYLON.Texture('/media/asteroid2diff.jpg', this.app.scene);
    let t12 = new BABYLON.Texture('/media/asteroid2normal.jpg', this.app.scene);
    t11.vScale = 2;
    t11.uScale = 2;
    t12.vScale = 2;
    t12.uScale = 2;
    this.asteroidMaterial.diffuseTexture = t11;
    this.asteroidMaterial.emissiveTexture = t11;
    this.asteroidMaterial.ambientTexture = t11;
    this.asteroidMaterial.bumpTexture = t12;

    this.selectedAsteroidMaterial.diffuseTexture = t11;
    this.selectedAsteroidMaterial.emissiveTexture = t11;
    this.selectedAsteroidMaterial.ambientTexture = t11;
    this.asteroidMaterial.bumpTexture = t12;

    this.asteroidSymbolMesh = BABYLON.MeshBuilder.CreatePlane('symbolshow1asteroid', {
      height: 1,
      width: 1,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.scene);
    this.asteroidSymbolMesh.setEnabled(false);

    let imgPath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes%2Fsymbol%2F' +
      encodeURIComponent('atari.svg') + '?alt=media';
    let m = new BABYLON.StandardMaterial('symbolshowmatasteroid', this.app.scene);
    let t = new BABYLON.Texture(imgPath, this.app.scene);
    t.hasAlpha = true;
    m.diffuseTexture = t;
    m.emissiveTexture = t;
    m.ambientTexture = t;
    this.asteroidSymbolMesh.material = m;

    this.asteroidSymbolMesh2 = BABYLON.MeshBuilder.CreatePlane('symbolshow1asteroid2', {
      height: 1,
      width: 1,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.scene);
    this.asteroidSymbolMesh2.setEnabled(false);
    let imgPath2 = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes%2Fsymbol%2F' +
      encodeURIComponent('commodore.svg') + '?alt=media';
    let m2 = new BABYLON.StandardMaterial('symbolshowmatasteroid2', this.app.scene);
    let t2 = new BABYLON.Texture(imgPath2, this.app.scene);
    t2.hasAlpha = true;
    m2.diffuseTexture = t2;
    m2.emissiveTexture = t2;
    m2.ambientTexture = t2;
    this.asteroidSymbolMesh2.material = m2;

    this.asteroidSymbolMesh3 = BABYLON.MeshBuilder.CreatePlane('symbolshow1asteroid3', {
      height: 1,
      width: 1,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.scene);
    this.asteroidSymbolMesh3.setEnabled(false);
    let imgPath3 = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes%2Fsymbol%2F' +
      encodeURIComponent('herbie.png') + '?alt=media';
    let m3 = new BABYLON.StandardMaterial('symbolshowmatasteroid3', this.app.scene);
    let t3 = new BABYLON.Texture(imgPath3, this.app.scene);
    t3.hasAlpha = true;
    m3.diffuseTexture = t3;
    m3.emissiveTexture = t3;
    m3.ambientTexture = t3;
    this.asteroidSymbolMesh3.material = m3;
  }
  async init(count = 15) {
    let scene = this.app.scene;

    this.asteroidsNameList = await this.app.readJSONFile('/asteroidslist.json');

    let ratio = 0;
    let max = this.asteroidsNameList.length;

    let overrideCount = this.app.urlParams.get('asteroidcount');
    if (overrideCount !== null)
      count = Number(overrideCount);

    if (count > max)
      count = max;
    this.randomArray = [];
    for (let c = 0; c < max; c++) {
      this.randomArray.push(c);
    }
    this.randomArray = this.app._shuffleArray(this.randomArray);
    this.randomArray = this.randomArray.slice(0, count);
    this.randomArray = this.randomArray.sort();
  }
  async loadAsteroid(asteroid, size = 3) {
    let scene = this.app.scene;
    let containerPath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes%2Fasteroids%2F' +
      encodeURIComponent(asteroid) + '?alt=media';
    let mesh = await U3D.loadStaticMesh(scene, containerPath);
    U3D.sizeNodeToFit(mesh, size);
    mesh.setEnabled(true);

    mesh.material = this.asteroidMaterial;
    mesh.isPickable = false;

    return mesh;
  }
}

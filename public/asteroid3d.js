import U3D from '/utility3d.js';

export default class Asteroid3D {
  constructor(app) {
    this.app = app;
    this.asteroidOrbitFrameCount = 300000 / 1000 * 60;

    this.asteroidMaterial = new BABYLON.StandardMaterial('asteroidMaterial', this.app.scene);
    this.asteroidMaterial.wireframe = true;
    this.asteroidMaterial.disableLighting = true;
    let t11 = new BABYLON.Texture('/media/asteroid2diff.jpg', this.app.scene);
    t11.vScale = 2;
    t11.uScale = 2;
    this.asteroidMaterial.diffuseTexture = t11;
    this.asteroidMaterial.emissiveTexture = t11;
    this.asteroidMaterial.ambientTexture = t11;

    this.asteroidMaterialRed = new BABYLON.StandardMaterial('asteroidMaterialRed', this.app.scene);
    this.asteroidMaterialRed.wireframe = true;
    this.asteroidMaterialRed.disableLighting = true;
    this.asteroidMaterialRed.diffuseColor = new BABYLON.Color3(0.4, 0, 0);
    this.asteroidMaterialRed.emissiveColor = new BABYLON.Color3(0.4, 0, 0);
    this.asteroidMaterialRed.ambientColor = new BABYLON.Color3(0.4, 0, 0);

    this.asteroidMaterialBlue = new BABYLON.StandardMaterial('asteroidMaterialBlue', this.app.scene);
    this.asteroidMaterialBlue.wireframe = true;
    this.asteroidMaterialBlue.disableLighting = true;
    this.asteroidMaterialBlue.diffuseColor = new BABYLON.Color3(0, 0, 0.4);
    this.asteroidMaterialBlue.emissiveColor = new BABYLON.Color3(0, 0, 0.4);
    this.asteroidMaterialBlue.ambientColor = new BABYLON.Color3(0, 0, 0.4);
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

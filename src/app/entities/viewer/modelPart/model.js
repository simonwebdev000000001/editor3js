import GUtils from '../../utils';

export default class Model {
  constructor(viewer) {

    this.viewer = viewer;
    this.materials = {
      base: viewer.model._curMaterial.clone(),
      thicknessPreview: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        side: THREE.BackSide,
        vertexColors: THREE.FaceColors,
        roughness: 0.3,
        metalness: 0.0,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      })
    }
  }

  // reset face colors to white
  resetFaceColors() {
    let faces = this.baseMesh.geometry.faces;
    for (let f = 0; f < faces.length; f++) {
      faces[f].color.setRGB(1.0, 1.0, 1.0);
    }

    this.baseMesh.geometry.colorsNeedUpdate = true;
  }

  getOctree(simpleMesh) {
    if (!this.octree || simpleMesh) this.octree = new Octree(simpleMesh || this.baseMesh);

    return this.octree;
  }

  viewThickness(threshold) {
    if (!threshold) return console.warn(`threshold should be not empty`);
    threshold = parseFloat(threshold);
    this.viewer._events.onSelectPart();

    // set the material
    this.baseMesh.material = this.materials.thicknessPreview;
    this.baseMesh.geometry = this.baseMesh._geometry;

    let octree = this.getOctree();


    // make sure the world matrix is up to date
    this.baseMesh.updateMatrixWorld();

    let geo = this.baseMesh.geometry;
    let vertices = geo.vertices;
    let faces = geo.faces;
    let matrixWorld = this.baseMesh.matrixWorld;

    let ray = new THREE.Ray();
    let normal = new THREE.Vector3();
    this.resetFaceColors();

    for (let f = 0, l = faces.length; f < l; f++) {
      let face = faces[f];

      // compute ray in world space
      ray.origin = Calculate.faceCenter(face, vertices, matrixWorld);
      ray.direction = normal.copy(face.normal).transformDirection(matrixWorld).negate();

      let intersection = octree.raycastInternal(ray);

      if (intersection) {
        let level = Math.min(intersection.distance / threshold, 1.0);

        face.color.setRGB(1.0, level, level);
      }
    }

    geo.colorsNeedUpdate = true;
    this.baseMesh._category = GUtils.CATEGORIES.NONE;

  }

  clearThicknessView() {
    this.baseMesh.material = this.materials.base;
    this.baseMesh._category = GUtils.CATEGORIES.STL_LOADED_PART;
    this.baseMesh.geometry = this.baseMesh.buffer_geometry;
  }


}
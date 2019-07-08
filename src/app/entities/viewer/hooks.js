import { Utils } from '../../utils';

THREE.Mesh.prototype._boxSize = function() {
  let _helper = new THREE.BoxHelper(this),
    {
      width,
      height,
      depth,
    } = _helper._boxSize();

  return {
    _helper,
    width,
    height,
    depth,
  };
};
THREE.BoxHelper.prototype._boxSize = function() {
  let _helper = this;
  _helper.geometry.computeBoundingBox();
  let _box = _helper.geometry.boundingBox,
    height = _box.min.distanceTo(new THREE.Vector3(_box.min.x, _box.min.y, _box.max.z)),
    width = _box.min.distanceTo(new THREE.Vector3(_box.max.x, _box.min.y, _box.min.z)),
    depth = _box.min.distanceTo(new THREE.Vector3(_box.min.x, _box.max.y, _box.min.z));

  return {
    x: width,
    y: depth,
    z: height,
    width,
    height,
    depth,
  };
};
THREE.Vector3.prototype.getPointInBetweenByPerc = function(pointB, percentage = 0.5) {

  let pointA = this.clone();
  let dir = pointB.clone().sub(pointA);
  let len = dir.length();
  dir = dir.normalize().multiplyScalar(len * percentage);
  return pointA.clone().add(dir);

};
THREE.Vector3.prototype.angleBtwThreePoint = function(B, C) {


  let A = this.clone();

  var AB = Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));
  var BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));
  var AC = Math.sqrt(Math.pow(C.x - A.x, 2) + Math.pow(C.y - A.y, 2));
  return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));

};

THREE.Mesh.prototype.getProductMaterial = function(hard) {
  if (!this.material) return;
  throw Error('can`t extract the material');
  let mesh = this,
    _matr = this.material._mat;
  if (_matr && !hard) {

  } else {
    let _mat = _matr = new Interfaces.IMaterial();
    _mat.name = mesh.material.name;
    _mat.maps = new Interfaces.IMaterialMaps();
    _mat.mapsRS = new Interfaces.IMaterialMaps();

  }

  _matr.settings = new Interfaces.IMaterialSettings(mesh.material);
  if (this.material.envMap) _matr.maps.envMap = mesh.material.envMap.image.map((map) => {
    return map.src;
  });
  /*for (let setting in _matr.settings) {
   if (setting == 'color') {
   _matr.settings.color = mesh.material.color.getStyle();
   } else {
   _matr.settings[setting] = mesh.material[setting];
   }
   }*/

};
THREE.Mesh.prototype.applyMatSettings = function(settings) {
  if (!settings) return console.error('no settings are selected');
  let material = this.material;
  for (let setting in  settings) {
    let val = (settings[setting]);
    if (settings.hasOwnProperty(setting) && !Utils.Config.isUndefined(val)) {
      if (setting == 'color') {
        if (!Utils.Config.isUndefined(val)) material[setting].setStyle(val);
      } else {
        val = parseFloat(val);
        if (Utils.Config.isNumber(val)) material[setting] = val;
      }
    }
  }
  material.needsUpdate = true;
};
THREE.Mesh.prototype.middle = function() {
  this.updateMatrix();
  this.updateMatrixWorld();
  var middle = new THREE.Vector3();
  var geometry = this.geometry;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  middle.x = (geometry.boundingBox.max.x + geometry.boundingBox.min.x) / 2;
  middle.y = (geometry.boundingBox.max.y + geometry.boundingBox.min.y) / 2;
  middle.z = (geometry.boundingBox.max.z + geometry.boundingBox.min.z) / 2;
  this.middleV = middle;


  var devide = new THREE.Vector3();
  if (this.parent) {
    this.parent.updateMatrixWorld();
    devide.copy(this.parent.position).negate();
  } else {
    this.updateMatrixWorld();
  }
  var vector = new THREE.Vector3();
  vector.setFromMatrixPosition(this.matrixWorld);
  this._pst = vector.clone();
  vector.add(devide);
  this.middleV = vector;

};
THREE.Object3D.prototype.findByKey = function(id, key = '_id') {
  let result;
  this.traverse((mesh) => {
    if (mesh[key] === id) {
      result = mesh;
    } else if (mesh._helper && mesh._helper[key] === id) {
      result = mesh._helper;
    }
  });
  return result;
};
THREE.Mesh.prototype.getMatrixR = function(isInner) {
  let

    mesh = this,
    translate = new Matrix4x4(),
    rotation = [new Matrix4x4(), new Matrix4x4(), new Matrix4x4()],
    scale = new Matrix4x4(),
    genPst = mesh.parent.position.clone();//.add(mesh.position);

  translate.set_translation_elements(genPst.x, genPst.y, genPst.z);
  //rotation[0].set_rotation(new THREE.Vector3(-1, 0, 0), mesh.rotation.x);
  rotation[1].set_rotation(new THREE.Vector3(0, -1, 0), /*mesh.rotation.y +*/ mesh.parent.angleRadians ? mesh.parent.angleRadians : 0);
  //rotation[2].set_rotation(new THREE.Vector3(0, 0, -1), mesh.rotation.z);
  scale.set_scaling(mesh.scale.x, mesh.scale.y, mesh.scale.z);
  return translate.multiply(rotation[0].multiply(rotation[1]).multiply(rotation[2])).multiply(scale);
};
THREE.Mesh.prototype.getVolume = function() {
  if (!this._geo) {
    this._geo = new THREE.Geometry();
    this._geo.fromBufferGeometry(this.geometry);
  }

  let triangles = this._geo.faces,
    _vert = this._geo.vertices,
    square = 0,
    volume = 0;
  for (let i = 0; i < triangles.length; i++) {
    let _triangle = triangles[i],
      v1 = _vert[_triangle.a],
      v2 = _vert[_triangle.b],
      v3 = _vert[_triangle.c];
    square += Utils.Config.getSquareOfTriangle(v1, v2, v3);
    volume += Utils.Config.getVolumeOfTriangle(v1, v2, v3);
  }
  let boxHelper = new THREE.BoxHelper(this),
    box = new THREE.Box3().setFromObject(this);
  //boxHelper.geometry.computeBoundingBox();
  boxHelper.geometry.computeBoundingSphere();
  boxHelper.square = square;
  boxHelper.volume = volume;
  boxHelper._size = box.size();
  return boxHelper;
};
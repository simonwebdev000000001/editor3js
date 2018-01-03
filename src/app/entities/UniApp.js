import {GlViewer} from "./viewer/glViewer.js";
import {Utils} from "../utils.js";

/**
 * Class representing a main action.
 */
export class UniApp {
    /**
     *@constructor
     *
     */
    constructor() {
        THREE.Mesh.prototype.getProductMaterial = function (hard) {
            if (!this.material)return
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
            if (this.material.envMap) _matr.maps.envMap = mesh.material.envMap.image.map((map)=> {
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
        THREE.Mesh.prototype.applyMatSettings = function (settings) {
            if (!settings)return console.error('no settings are selected');
            let material = this.material;
            for (let setting in  settings) {
                let val = ( settings[setting]);
                if (settings.hasOwnProperty(setting) && !Utils.Config.isUndefined(val)) {
                    if (setting == 'color') {
                        if (!Utils.Config.isUndefined(val))material[setting].setStyle(val);
                    } else {
                        val = parseFloat(val);
                        if (Utils.Config.isNumber(val))material[setting] = val;
                    }
                }
            }
            material.needsUpdate = true;
        };
        THREE.Mesh.prototype.middle = function () {
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
        THREE.Mesh.prototype.getMatrixR = function (isInner) {
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
        THREE.Mesh.prototype.getVolume = function () {
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
        }
        Node.prototype._display = function (disp) {
            this.style.display = disp ? 'block' : 'none';
        };
        Image.prototype.load = function (url) {
            var thisImg = this;
            var xmlHTTP = new XMLHttpRequest();
            xmlHTTP.open('GET', url, true);
            xmlHTTP.responseType = 'arraybuffer';
            xmlHTTP.onload = function (e) {
                var blob = new Blob([this.response]);
                thisImg.src = window.URL.createObjectURL(blob);
            };
            xmlHTTP.onprogress = function (e) {
                thisImg.completedPercentage = parseInt((e.loaded / e.total) * 100);
                if (thisImg.onprogress)thisImg.onprogress(thisImg.completedPercentage);
            };
            xmlHTTP.onloadstart = function () {
                thisImg.completedPercentage = 0;
                if (thisImg.onStartLoad)thisImg.onStartLoad();
            };
            xmlHTTP.send();
        };
        window.addEventListener("error", function (e) {
            if (e && e.target && e.target.nodeName && e.target.nodeName.toLowerCase() == "img") {
                e.target.src = Utils.Config.DEFAULT_IMAGE;
            }
        }, true);
        THREE.ImageUtils.crossOrigin = '';
        Image.prototype.completedPercentage = 0;
        //Image.prototype.crossOrigin = 'anonymous';
        String.prototype.json = function () {
            if (this.length < 2)return this;
            return JSON.parse(this)
        };

        this.materials = [];
        this.urlParams = {};
        let urlObj = location.href.split("?")[1];
        if (urlObj)urlObj = urlObj.split("&");
        if (urlObj) {
            for (let i = 0; i < urlObj.length; i++) {
                let _obj = urlObj[i].split("=");
                if (_obj.length > 1) {
                    this.urlParams[_obj[0]] = _obj[1];
                }
            }
        }
        this.glViewer = new GlViewer(this.options, {
            component: this,
            options: {}
        });

    }


}


UniApp.Utils = Utils;

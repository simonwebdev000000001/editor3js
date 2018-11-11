import { Utils } from "../../utils.js";
import { MEvents } from "./glEvents.js";
import { MyGui } from "../helpers/MyGui.js";
import { MStorage } from "../helpers/MStorage.js";
import { resolve } from "path";
import GUtils from "../utils";

import ModelPart from './modelPart';
import GlUi from "./glUI";

/**
 * @class viewver controller
 */
export class GlViewer {
    constructor(options, main) {
        if (!Detector.webgl) return Detector.addGetWebGLMessage();
        let _self = this;
        this.TOTAL_FILE_LOADED = 0;
        this.TOTAL_ITEMS_FILE_LOADED = 0;
        this.products = {};
        this.options = options || {};
        this.main = main || {};
        this.clock = new THREE.Clock();

        this.decorations = [];
        let parentNode = this.parentNode = this.options.container || document.getElementById(GUtils.SETTINGS.CONTAINER_APP_ID) || document.createElement('div');
        let container = this.container = document.createElement('div'),
            containerHandler = (container.addEventListener || container.attachEvent).bind(container);
        container.className += ' viewer webgl-view';
        container.setAttribute("id", GUtils.SETTINGS.CONTAINER_APP_ID);

        let labelContainer = this.labelContainer = document.createElement('div');
        labelContainer.className = 'labels';
        container.appendChild(labelContainer);
        let _d = this.glcontainer = document.createElement('div');
        _d.className = 'center-container THREEJS';
        container.appendChild(_d);
        var p = document.createElement('p');
        p.className = "info";
        p.innerHTML = "Hold Shift and Left Click to select the model part. <b>W</b> - translate, <b>E</b> - rotate, <b>R</b> - scale. Press <b>Q</b> to toggle world/local space";
        // container.appendChild(p);
        if (!parentNode.parentNode) document.body.appendChild(parentNode);
        parentNode.appendChild(container);
        let tabSizeInfo = this.tabSizeInfo = document.createElement('div');
        tabSizeInfo.className = 'tab-size-info';
        container.appendChild(tabSizeInfo);





        this.categories = {};
        this.cash = { models: {} };
        this.iterToRender = 0;
        this.initScene();
        // this.preloader = new Utils.Preloader(this);
        // this._cntxMenu = new CntxMenu(this);
        this.move.isFinish = true;

        //this.loadModel(()=> {})
        this.loadedModels = 0;

        _self.materialType = 3;
        _self.updateMaterials();
        this._ui = new GlUi(_self);


        this._animation = new Animation(this);
        this._events = new MEvents(this);

        this.zoomCamera();
        // this._transformUI = new TransformControls(this);

        // this.preloader.fade();  
    }

    toScreenPosition(obj) {
        let { camera, gl } = this;
        var vector = new THREE.Vector3();

        var widthHalf = 0.5 * gl.context.canvas.width;
        var heightHalf = 0.5 * gl.context.canvas.height;

        obj.updateMatrixWorld();
        vector.setFromMatrixPosition(obj.matrixWorld);
        vector.project(camera);

        vector.x = (vector.x * widthHalf) + widthHalf;
        vector.y = - (vector.y * heightHalf) + heightHalf;

        return {
            x: Math.round(vector.x),
            y: Math.round(vector.y)
        };

    }
    updateMaterials() {
        this.lights.visible = false;
        let _m = this.model._curMaterial = new THREE.MeshBasicMaterial(),
            _type = parseInt(this.materialType);

        this.model._selectedMaterial = new THREE.MeshPhongMaterial({ color: GUtils.COLORS.SELECTED });
        switch (_type) {
            case 1: {
                _m.wireframe = true;
                break;
            }
            case 3: {
                this.lights.visible = true;
                _m = this.model._curMaterial = new THREE.MeshPhongMaterial();
                break;
            }
        }
        this.model.traverse((mesh) => {
            if (mesh.material || mesh.type == "Mesh") {
                mesh.material = _m;
            }
        });
    }
    loadStlFile(url,name) {
        return new Promise((resolve, reject) => {
            let self = this;
            var loader = new THREE.STLLoader();
            loader.load(url, (orGeometry) => {
                if(GUtils.SETTINGS.SHOULD_FILL)this.fillMeshInChamber(orGeometry);

                new ModelPart(this, {orGeometry,name});
                //alert("Loaded");
                self.zoomCamera();
                resolve();
            }, (e) => { console.log(e) }, (e) => { console.log(e); reject(); }, (e) => { console.log(e) });
        })

    }
    exportToStl() {
        let exporter = new THREE.STLExporter();
        let arg = {}, indexPfMesh = 0;
        if (e.target.innerText == 'binary') {
            arg.binary = true;
        }

        let listOfMeshes = _self.model.children;
        if (!listOfMeshes.length) return alert("Import some model before export !!!");
        let geoemtryTomerge = listOfMeshes[0].geometry;
        for (let i = 0; i < listOfMeshes.length; i++) {
            geoemtryTomerge = THREE.BufferGeometryUtils.mergeBufferGeometries([geoemtryTomerge, listOfMeshes[i]]);
        }

        let meshToexprt = new THREE.Mesh(geoemtryTomerge);
        function save(blob, filename) {
            var link = document.createElement('a');
            link.style.display = 'none';
            document.body.appendChild(link);
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            document.body.removeChild(link);

        }
        function saveArrayBuffer(buffer, filename) {
            save(new Blob([buffer], { type: 'application/octet-stream' }), filename);
        }
        saveArrayBuffer(exporter.parse(meshToexprt, arg), 'mesh.stl');
    }


    fillMeshInChamber(geometry) {
        let mesh = new THREE.Mesh(geometry),
            helper = new THREE.BoxHelper(mesh),
            center = helper.geometry.boundingSphere.center.clone().negate(),
            _center = this.scene.helper._boxHelper.geometry.boundingSphere.center,
            scale = this.scene.helper._boxHelper.geometry.boundingSphere.radius / helper.geometry.boundingSphere.radius;
        helper.geometry.computeBoundingBox();

        let box = helper.geometry.boundingBox,
            _height = box.min.y - box.max.y,
            height = Math.sqrt(_height * _height);


        geometry.translate(center.x, (center.y + height / 2), center.z);
        geometry.scale(scale, scale, scale);
        center.add(_center);
        geometry.translate(center.x, 0, center.z);

    }


    updateRender(settings) {
        let _set = settings || {};
        _set.clearColor = false;
        _set.antialias = true;
        // _set.preserveDrawingBuffer = true;
        //_set.physicallyCorrectLights = true;
        if (this.gl) _set.canvas = this.gl.domElement;
        let renderer = this.gl = new THREE.WebGLRenderer(_set);
        renderer.toneMapping = THREE.LinearToneMapping;
        for (let _f in _set) renderer[_f] = _set[_f];
        renderer.setClearColor(GUtils.COLORS.BACKGROUND, 1);
        //renderer.shadowMap.enabled = true;//!!_set.shadows;
        //renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.sortObjects = false;
        //renderer.gammaInput = !!_set.gammaInput;
        //renderer.gammaOutput = !!_set.gammaOutput;
        if (_set.pixelRatio) renderer.setPixelRatio(_set.pixelRatio);
        if (this.composer) this.composer.renderer = renderer;
    }

    initScene() {
        let scene = this.scene = new THREE.Scene();
        this.model = new THREE.Object3D();
        this.model.name = 'model' + Date.now();
        this.scene.add(this.model);
        this.updateRender({
            //alpha: true, antialias: true, gammaInput: true, gammaOutput: true, shadows: false
        });
        let _dC = this.main.component.urlParams,
            renderer = this.gl;


        renderer.domElement.className = 'gl-view';
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(this._W(), this._H());
        //renderer.setDepthTest(false);
        //renderer.setClearColor(_self.clearColor = '#8e8e8e', 0);
        //renderer.gammaInput = renderer.gammaOutput = !!location.href.match('withGamma');
        //this.anisotropy = renderer.getMaxAnisotropy();
        this.glcontainer.appendChild(renderer.domElement);

        let camera = this.camera = new THREE.PerspectiveCamera(45, this._W() / this._H, 1, 2000);
        this.camera.positionDef = new THREE.Vector3(
            GUtils.CHAMPER.WIDTH * 2,
            GUtils.CHAMPER.WIDTH * 0.5,
            GUtils.CHAMPER.WIDTH * 2
        );
        this.camera.position.copy(this.camera.positionDef);
        this.camera.lookAt(this.scene.position);
        this.camera.updateProjectionMatrix();
        let controls = this.controls = new THREE.OOrbitControls(camera, renderer.domElement);
        this.controls.constraint.smoothZoomSpeed = this.controls.smoothZoomSpeed = 5.0;
        this.controls.enableDamping = true;
        this.controls.inverse = false;
        this.controls.autoRotateSpeed = 0.10;
        this.controls.constraint.smoothZoom = true;
        this.controls.constraint.zoomDampingFactor = this.controls.zoomDampingFactor = 0.12;


        controls.autoRotate = controls.enableZoom = true;
        controls.enableDamping = true;//!this.isMobile;
        controls.dampingFactor = 0.1;
        //controls.inverseY = true;
        //controls.inverseX = true;
        controls.rotateSpeed = 0.1693;
        controls.rotateSpeedUP = 0.06493;
        //controls.zoomSpeed = 0.87;
        //if (isMobile) controls.zoomSpeed = 1;
        controls.enableKeys = false
        controls.maxPolarAngle = Math.PI * 0.461;
        controls.addEventListener('change', (e) => {
            this.refresh();
            this.scene.traverse((child) => {
                if (child._control) {
                    child._control.updateLabel();
                }
            })
        });
        let transformControls = this.transformControls = new THREE.TransformControls(camera, renderer.domElement);


        transformControls.transformControls = new THREE.TransformControls(camera, renderer.domElement);
        transformControls.addEventListener('mouseDown', (...e) => {

            transformControls.tempParent._box.onStartTranslate();
        });
        transformControls.addEventListener('mouseUp', () => {
            transformControls.tempParent._box.onEndTranslate();
        });
        transformControls.addEventListener('change', () => {
            transformControls.tempParent._box.onChangeTranslate(transformControls.worldPositionStart,transformControls.worldPosition);
            this.scene.traverse((child) => {
                if (child._control) {

                    child._control.updateLabel();
                    child._control.updateLabelValue();
                }
            })
        });
        transformControls.addEventListener('dragging-changed', function (event) {
            controls.enabled = !event.value;
        });

        this.addLights();
        this.applyBoxChamber();
        // floor.castShadow = floor.recieveShadow = true;
        // floor.rotation.x = Math.PI / 2;
        //scene.add(floor);



    }

    applyBoxChamber() {
        if (this.chamber) {
            this.chamber.parent.parent.remove(this.chamber.parent);
            // this.chamber.parent.remove(this.chamber);
            // this.chamber.gridHelper.parent.remove(this.chamber.gridHelper);
        }
        let
            scalebleItems = new THREE.Object3D(),
            scale = new THREE.Vector3(
                GUtils.CHAMPER.WIDTH/GUtils.CHAMPER.DEFAULT,
                GUtils.CHAMPER.HEIGHT/GUtils.CHAMPER.DEFAULT,
                GUtils.CHAMPER.HEIGHT/GUtils.CHAMPER.DEFAULT
            ),
            box = new THREE.Mesh(new THREE.BoxBufferGeometry(
            GUtils.CHAMPER.WIDTH,
            GUtils.CHAMPER.HEIGHT,
            GUtils.CHAMPER.DEPTH
        ));
        box.position.set(
            GUtils.CHAMPER.WIDTH / 2,
            GUtils.CHAMPER.HEIGHT / 2,
            GUtils.CHAMPER.DEPTH / 2
        );
        // box.position.y = GUtils.CHAMPER.HEIGHT / 2;
        this.chamber = new THREE.BoxHelper(box, GUtils.COLORS.GRAY);

        let size = GUtils.CHAMPER.DEFAULT,
            divisions = 10,
            gridHelper = this.chamber.gridHelper = new THREE.GridHelper(size, divisions, 0x444444, GUtils.COLORS.GRAY),
            gridMiddleHelper = new THREE.Object3D(),
            middleLines = [
                {
                    color: GUtils.COLORS.RED,
                    scale: 'z',
                    points: [
                        new THREE.Vector3(-size / 2, 0, 0),
                        new THREE.Vector3(size / 2, 0, 0)
                    ]
                },
                {
                    color: GUtils.COLORS.BLUE,
                    scale: 'x',
                    points: [
                        new THREE.Vector3(0, 0, -size / 2),
                        new THREE.Vector3(0, 0, size / 2)
                    ]
                }
            ];

        gridHelper.scale.x = GUtils.CHAMPER.WIDTH / size;
        gridHelper.scale.z = GUtils.CHAMPER.DEPTH / size;
        gridHelper.position.set(
            (GUtils.CHAMPER.WIDTH / 2),
            0,
            (GUtils.CHAMPER.DEPTH / 2)
        );
        middleLines.forEach((el) => {
            let
                curve = new THREE.CatmullRomCurve3(el.points),
                geometry = new THREE.TubeBufferGeometry(curve, 10, 1, 10, false),
                material = new THREE.MeshPhongMaterial({
                    color: el.color
                }),
                scale = 0.2,
                mesh = new THREE.Mesh(geometry,  new THREE.LineBasicMaterial({
                    color: el.color,
                    linewidth: 13,
                }));
            mesh.scale[el.scale] = scale;
            mesh.scale.y = scale;

            gridMiddleHelper.add(mesh);
        })
        gridHelper.add(gridMiddleHelper);
        // if (!this.scene.helper) {
        let helper = this.scene.helper = new THREE.Object3D();
        this.scene.add(this.scene.helper);
        // }
        this.scene.helper.add(gridHelper);
        this.scene.helper.add(this.chamber);
        this.chamber.add(scalebleItems);

        let axes = new THREE.Object3D(),
            axisLbels = new THREE.Object3D(),
            axises = [
                {
                    points: [
                        new THREE.Vector3(0, 0, 0),
                        new THREE.Vector3(0, 1, 0)
                    ],
                    size: GUtils.CHAMPER.HEIGHT,
                    color: GUtils.COLORS.GREEN,
                },
                {
                    points: [
                        new THREE.Vector3(0, 0, 0),
                        new THREE.Vector3(0, 0, 1)
                    ],
                    size: GUtils.CHAMPER.DEPTH,
                    vector3: new THREE.Vector3(-1, 0, 0),
                    quaternion: new THREE.Vector3(1, 0, 0),
                    color: GUtils.COLORS.BLUE
                },
                {
                    points: [
                        new THREE.Vector3(0, 0, 0),
                        new THREE.Vector3(1, 0, 0)
                    ],
                    size: GUtils.CHAMPER.WIDTH,
                    vector3: new THREE.Vector3(0, 0, -1),
                    quaternion: new THREE.Vector3(0, 0, -1),
                    color: GUtils.COLORS.RED
                }
            ]


        let  dist = Math.max(GUtils.CHAMPER.DEFAULT / 5,0.5),
        minScale=-Infinity;
        axises.forEach((el) => {
            let _points = [...el.points],

                scaleL = el.size/GUtils.CHAMPER.DEFAULT,
                direction = _points[1].clone();
            _points[1] = _points[0].clone().addScaledVector(direction, dist);
            minScale = Math.max(minScale,scaleL);
            let
                curve = new THREE.CatmullRomCurve3(_points),
                size = dist*0.02,
                conusHeight = 10 * size,
                geometry = new THREE.TubeBufferGeometry(curve, 10, size, 10, true),
                material = new THREE.MeshPhongMaterial({
                    color: el.color
                }),
                mesh = new THREE.Mesh(geometry, material);

            geometry = new THREE.ConeBufferGeometry(2 * size, conusHeight, 64);
            let cone = new THREE.Mesh(geometry, material);
            cone.position.addScaledVector(direction, dist);
            axes.add(mesh);
            mesh.add(cone);
            mesh.scale.multiplyScalar(scaleL);

            if (el.quaternion) {
                let quaternion = new THREE.Quaternion();
                quaternion.setFromAxisAngle(el.quaternion, Math.PI / 2);
                cone.quaternion.slerp(quaternion, 1);

            }
            //axis labels
            let sp = GUtils.label(el);
            sp.position.copy(_points[0].clone().addScaledVector(direction, el.size / 2));
            if (el.vector3) sp.position.addScaledVector(el.vector3, dist*0.5*scaleL);
            sp.scale.multiplyScalar(scaleL);
            axisLbels.add(sp);
        })

        let centerAxes = new THREE.Mesh(new THREE.SphereBufferGeometry(dist*0.03,36,36), new THREE.MeshPhongMaterial({
            color: 0xffffff
        }));
        centerAxes.scale.multiplyScalar(minScale);
        axes.add(centerAxes);
        helper.add(axes);
        helper.add(axisLbels);


        helper._boxHelper = new THREE.BoxHelper(this.scene.helper);

        let scaleEl = helper._boxHelper.geometry.boundingSphere.radius /87.46;
        // scalebleItems.scale.multiplyScalar( scaleEl);
        gridMiddleHelper.scale.y = scaleEl;
        // console.log(scaleEl)
    }


    setNewPst(nPosition, cameraRoompst) {
        if (!nPosition) nPosition = this.scene.position;

        //this.model.traverse((child)=>{
        //   if(child.type == this.ENTITY.Config.MODELS.TYPES.MESH){
        //       if(!child.position0)child.position0 = child.position.clone();
        //       child.position.copy(child.position0.clone().add(nPosition));
        //   }
        //});
        let defPs = [this.model.position.clone(), this.camera.position.clone(), this.controls.target.clone()];
        this.model.position.copy(nPosition);
        let
            p1 = this.model.position.clone(),
            p3 = this.zoomCamera(null, nPosition, null, () => {
            });
        if (cameraRoompst) {
            let
                p2 = new THREE.Vector3(cameraRoompst.x, cameraRoompst.y, cameraRoompst.z),
                dir1 = new THREE.Vector3(),
                dir2 = new THREE.Vector3(),
                dir3 = new THREE.Vector3();
            dir1.subVectors(p2, p1).normalize();
            dir2.subVectors(p3, p1).normalize();
            dir3.subVectors(p2.clone().negate(), p1).normalize();
            let p12 = Math.sqrt(Math.pow((p1.x - p2.x), 2) + Math.pow((p1.z - p2.z), 2));
            let p13 = Math.sqrt(Math.pow((p1.x - p3.x), 2) + Math.pow((p1.z - p3.z), 2));
            let p23 = Math.sqrt(Math.pow((p2.x - p3.x), 2) + Math.pow((p2.z - p3.z), 2));
            let alpha = Math.acos(((Math.pow(p12, 2)) + (Math.pow(p13, 2)) - (Math.pow(p23, 2))) / (2 * p12 * p13));
            this.model.angleRadians = dir2.z > dir1.z || (dir2.z > 0 && dir2.x < 0) || (dir2.z > dir3.z && dir2.x < 0) ? alpha : 2 * Math.PI - alpha;
        }
        let res = this.updateSceneMeshMatrix();
        if (cameraRoompst) {
            this.model.position.copy(defPs[0]);
            this.camera.position.copy(defPs[1]);
            this.camera.updateProjectionMatrix();
            this.controls.target.copy(defPs[2]);
        }
        return res;

    }

    zoomCamera(model, nPosition, _target, onFinish) {
        // if (!model && !this.model.children.length) return;
        if (!nPosition) nPosition = this.scene.helper._boxHelper.geometry.boundingSphere.center.clone();
        let fix = nPosition.fix;
        nPosition = new THREE.Vector3(nPosition.x, nPosition.y, nPosition.z);
        let target = nPosition.clone();
        if (_target) target = _target;
        let radius = this.scene.helper._boxHelper.geometry.boundingSphere.radius;//= this.model.radius;

        // if (!radius) {
        // radius = this.reCalcRadius();
        // target = this.scene.helper._boxHelper.geometry.boundingSphere.center.clone(); 
        //let boxHelper = new THREE.BoxHelper(model || this.model);
        //radius = boxHelper.geometry.boundingSphere.radius;
        //this.model.boxHelper = boxHelper;
        //boxHelper.geometry.computeBoundingBox();
        // }

        let sc = 2.2,
            newPst = fix ? nPosition.clone() : nPosition.clone().addScaledVector(this.camera.getWorldDirection().negate(), radius * sc);

        // this.model.radius = radius;

        if (onFinish) {
            this.camera.position.copy(newPst);
            this.camera.updateProjectionMatrix();
            this.controls.target.lerp(target);
            onFinish();
        } else {
            //this.spotLight.position.copy(newPst.clone().addScaledVector(newPst.clone().sub(nPosition).normalize(), radius));
            //this.spotLight.position.y += Math.abs(this.spotLight.position.y * 1);
            //this.spotLight.lookAt(nPosition);
            this.move({
                onStart: () => {
                    this.controls.enabled = true;
                    this.refresh();
                }, onComplete: () => {
                    this.refresh();
                    this.controls.minDistance = radius;
                    this.controls.maxDistance = 105 * radius;
                    this.camera.far = this.controls.maxDistance * 2 * 100;
                    this.camera.near = this.controls.minDistance * 0.1;
                    this.camera.updateProjectionMatrix();

                }, list: [{
                    onUpdate: (delta) => {
                        this.camera.position.lerp(newPst, delta);
                        this.camera.updateProjectionMatrix();
                        this.controls.target.lerp(target, delta);
                    }
                }]
            });
        }
        return newPst;
    }

    onDestroy() {
        this._events.onDestroy();
        this.preloader.onDestroy();
        Utils.Config.removeChildNodes(this.container);
    }



    reCalcRadius(model) {
        let
            _model = model || this.model,
            boxHelper = new THREE.BoxHelper(_model);
        boxHelper.geometry.computeBoundingBox();
        //boxHelper.geometry.computeBoundingSphere();
        let radius = _model.radius = boxHelper.geometry.boundingSphere.radius;
        this.model.boxHelper = boxHelper;
        _model.radius = radius;
        return radius;
    }

    addLights() {
        /*-------lights--------*/
        this.lights = new THREE.Object3D();
        this.lights.visible = false;
        this.scene.add(this.lights);

        this.changes = [
            ['position', 'quaternion', 'scale', 'category'],
            ['intensity', 'distance', 'decay', 'color', 'angle', 'penumbra', 'visible', 'skyColor', 'groundColor', 'castShadow']
        ]
        try {
            let data = MStorage.getItem('data');
            if (data && false) {

                for (let i = 0; i < data.lights.length; i++) {
                    let _l = data.lights[i],
                        _el = this.createLight(_l.category, _l);
                    if (this._datGui) this._datGui.addlight(_el);
                }

                for (let i = 0; i < data.shapes.length; i++) {
                    let _l = data.shapes[i],
                        _el = this.createShape(_l.category, _l);
                    if (this._datGui) this._datGui.addShape(_el);
                }
            } else {
                let _el = this.createLight(1);
                this.createLight(4);
                if (this._datGui) this._datGui.addlight(_el);
            }
        } catch (e) {
            let _el = this.createLight(1);
            this.createLight(4);
            if (this._datGui) this._datGui.addlight(_el);
        } finally {
            if (this.main.options.helper) this.scene.add(new THREE.AxisHelper(500));
        }


    }


    createLight(category, settings) {
        let light, helper;
        switch (+category) {
            case 1:
                {
                    light = new THREE.AmbientLight(0xffffff, 0.81);
                    break;
                }
            case 2:
                {
                    light = new THREE.HemisphereLight(0xffffff, 0x000000, 0.09);
                    helper = new THREE.HemisphereLightHelper(light, 5);
                    light.position.set(0, 100, 0);
                    break;
                }
            case 3:
                {
                    light = new THREE.SpotLight(0xffffff, 0.141);
                    light.position.set(5, 5, 5);
                    light.shadow.mapSize.width = 1024;
                    light.shadow.mapSize.height = 1024;
                    light.shadow.camera.near = 1;
                    light.shadow.camera.far = this.camera.far;
                    light.angle = 0.5;//Math.PI / 2;
                    light.penumbra = 0.05;
                    light.decay = 2;
                    light.distance = this.camera.far;
                    light.castShadow = true;
                    light.shadow.mapSize.width = 1024;
                    light.shadow.mapSize.height = 1024;
                    light.shadow.camera.near = 10;
                    light.shadow.camera.far = this.camera.far;
                    helper = new THREE.SpotLightHelper(light);
                    break;
                }
            case 4:
                {
                    light = new THREE.DirectionalLight(0xffffff, 0.15);
                    light.position.set(5, 5, 5);
                    light.shadow.mapSize.width = 1024;
                    light.shadow.mapSize.height = 1024;
                    light.shadow.camera.near = 1;
                    light.shadow.camera.far = this.camera.far;
                    helper = new THREE.DirectionalLightHelper(light, 5);
                    break;
                }
            case 5:
                {
                    light = new THREE.PointLight(0xffffff, 2, 1024);
                    light.position.set(0, 5, 0);
                    helper = new THREE.PointLightHelper(light, 1);
                    break;
                }
            default:
                {
                    return;
                }
        }
        if (light) {
            light.castShadow = true;
            light.category = category;


            this.lights.add(light);
            if (helper && this.isAdmin) {
                this.model.add(helper);
                helper.MODE = 2;
                light._helper = helper;
            }
            if (settings) {
                let _g = this.changes[0];
                let _gL = this.changes[1];
                for (let i = 0; i < _g.length - 1; i++) {
                    let _l = _g[i];
                    for (let f in settings[_l]) light[_l][f] = settings[_l][f];
                }

                for (let i = 0; i < _gL.length; i++) {
                    let _l = _gL[i];
                    if (settings[_l] == undefined) continue;
                    if (_l.toLowerCase().match('color')) {
                        light[_l].setHex('0x' + settings[_l].substr(1));
                    } else {
                        light[_l] = settings[_l];
                    }
                }
            }
        }
        return light;

    }

    createShape(category, settings) {
        let shape;
        switch (+category) {
            case 1:
                {
                    shape = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 1, 1), new THREE.MeshPhongMaterial());
                    break;
                }

            default:
                {
                    return;
                }
        }
        if (shape) {
            shape.castShadow = true;
            shape.category = category;
            shape.MODE = 1;
            this.model.add(shape);
            if (settings) {
                let _g = this.changes[0];
                for (let i = 0; i < _g.length - 1; i++) {
                    let _l = _g[i];
                    for (let f in settings[_l]) shape[_l][f] = settings[_l][f];
                }
            }
        }
        return shape;
    }

    onError(xhr) {
        console.error(xhr);
    }

    onProgress(xhr) {
        if (xhr.lengthComputable) {
            this.preloader.onUpdatePreloaderStatus(xhr.loaded / xhr.total);
        }
    }

    refresh() {
        if (this._animation) this._animation.play(true);
    }

    /**
     * @returns {string} -  base64 image
     * */
    getRenderImage() {
        return this.gl.domElement.toDataURL()
    }

    getDirection(s, d) {
        return ((-Math.PI / 2 + -(Math.atan2((d.y - s.y), (d.x - s.x)))) + (Math.PI * 2)) % (Math.PI * 2);
    }

    getNextPosition(CENTER, point, rotation) {

        let
            center = CENTER.clone(),
            radius = center.distanceTo(point),
            RayCast = this.raycast = this.raycast || new THREE.Raycaster(),
            newAngle, curentRotationInRad, nRotation, _X, _Z;


        center.y = point.y;
        RayCast.setFromCamera({ x: 0, y: 0 }, this.camera);
        newAngle = this.toV2({ x: 0, y: 0 }, { x: RayCast.ray.direction.x, y: RayCast.ray.direction.z });
        curentRotationInRad = ((-Math.PI / 2 + -newAngle) + (Math.PI * 2)) % (Math.PI * 2);
        nRotation = (curentRotationInRad + ((Math.PI / 180) * rotation));
        _X = center.x + radius * Math.sin(nRotation);
        _Z = center.z + radius * Math.cos(nRotation);
        return new THREE.Vector3(_X, point.y, _Z);
    }

    toV2(source, destination) {
        return Math.atan2((destination.y - source.y), (destination.x - source.x));
    }

    _W() {
        return window.innerWidth || this.glcontainer.clientWidth || this.container.clientWidth || 720;
    }

    _H() {
        return window.innerHeight || this.glcontainer.clientHeight || this.container.clientHeight || 405;
    }



    move(arg) {
        let _self = this,
            controls = this.controls;
        if (!this.move.isFinish) return;
        this.refresh();
        let duration = arg.duration || 900,
            tween = new TWEEN.Tween({ delta: 0 }).to({ delta: 1 }, duration)
                .easing(TWEEN.Easing.Exponential.In)
                .onStart(() => {
                    controls.enabled = this.move.isFinish = /*this.personControls.enabled = */false;
                    if (arg.onStart) arg.onStart();
                })
                .onUpdate(function (delta) {
                    for (let i = 0, list = arg.list || arg; i < list.length; i++) {
                        list[i].onUpdate(this.delta);
                    }
                })
                .onComplete(() => {
                    this.move.isFinish = controls.enabled = true;
                    tween.stop();
                    tween = null;
                    if (arg.onComplete) arg.onComplete();
                })
                .start()
            ;

    }



    render() {
        //if (Pace.running) return;
        this.controls.update();
        TWEEN.update();
        //this.gl.toneMappingExposure = Math.pow( 0.9, 4.0 );

        // if (this.composer && this.composer.enabled) {
        //     this.composer.render();
        // } else {
        this.gl.render(this.scene, this.camera);
        // }

    }

    dispoce() {
        let removeMeshes = [];
        this.transformControls.detach();
        this.scene.remove(this.transformControls);
        this.model.traverse((mesh) => {
            if (mesh.type == Utils.Config.MODELS.TYPES.MESH) {
                removeMeshes.push(mesh);
            }
        });
        for (let i = 0; i < removeMeshes.length; i++) {
            this.model.remove(removeMeshes[i]);
            //for(let m=0,maps = Utils.Config.MAT_MAPS;m<maps.length;m++){
            //   if(removeMeshes[i].material[maps[m]]) removeMeshes[i].material[maps[m]].dispoce();
            //}
            //removeMeshes[i].geometry.dispoce();
            //removeMeshes[i].material.dispoce();
        }
        for (let model in this.cash.models) {
            if (this.cash.models.hasOwnProperty(model)) {
                this.cash.models[model].matrix = new THREE.Matrix4();
                this.cash.models[model].material = this.defMat.clone();
            }
        }
    }
}
/**
 * @class animations viewver controller
 */
export class Animation {
    constructor(main) {
        this.canAnimate = false;
        this.id = Date.now();
        this.lastUpdate = Date.now();
        this.maxTimeUpdate = 2500;
        this.animations = [];
        this.lastIter = 0;
        //window.animateFrame = main.isMobile || 1 ? (callback)=> {
        //    return setTimeout(callback, 1000 / (60 / 1.8))
        //} : requestAnimationFrame;
        //this.stats = new Stats();
        //this.stats.showPanel( 0 );
        //document.body.appendChild( this.stats.dom );
        this.main = main;
        this.play(1);
        this.animate();

    }

    add(callback) {
        this.animations.push(callback);
    }

    animate() {
        //this.stats.begin();
        /* for (let i = 0; i < this.animations.length; i++) {
            this.animations[i]();
        }
       if (this.canAnimate  ) {
 
            this.canAnimate = this.lastUpdate > Date.now();
            if (!this.canAnimate || this.lastIter > 2) this.lastIter = 0;
            
        }*/

        if (this.main.iterToRender++ % 4 == 0) {
            this.main.iterToRender = 0;
            this.main.render();
        }
        //this.stats.end();
        requestAnimationFrame(() => {
            this.animate();
        });
    }

    play(flag) {
        this.lastUpdate = Date.now() + (this.maxTimeUpdate);
        if (this.canAnimate) return;
        this.canAnimate = flag;//|| !Pace.running;
    }

    stop() {
        this.canAnimate = false;
        this.lastIter = 0;
    }
}
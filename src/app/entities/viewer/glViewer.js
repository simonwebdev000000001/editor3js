import {Utils} from "../../utils.js";
import {MEvents} from "./glEvents.js";
import {MyGui} from "../helpers/MyGui.js";
import {MStorage} from "../helpers/MStorage.js";


/**
 * @class viewver controller
 */
export class GlViewer {
    constructor(options, main) {
        if (!Detector.webgl) return Detector.addGetWebGLMessage();
        let _self = this;
        this.products = {};
        this.options = options || {};
        this.main = main || {};
        this.clock = new THREE.Clock();

        this.decorations = [];
        let parentNode = this.parentNode = this.options.container || document.getElementById('WEBGLVIEW') || document.createElement('div');
        let container = this.container = document.createElement('div'),
            containerHandler = (container.addEventListener || container.attachEvent).bind(container);
        container.className += ' viewer webgl-view';
        let _d = this.glcontainer = document.createElement('div');
        _d.className = 'center-container THREEJS';
        container.appendChild(_d);
        var p = document.createElement('p');
        p.className = "info";
        p.innerHTML = "Hold Shift and Left Click to select the model part. <b>W</b> - translate, <b>E</b> - rotate, <b>R</b> - scale. Press <b>Q</b> to toggle world/local space";
        // container.appendChild(p);
        if (!parentNode.parentNode)document.body.appendChild(parentNode);
        parentNode.appendChild(container);
        let tabSizeInfo = this.tabSizeInfo = document.createElement('div');
        tabSizeInfo.className = 'tab-size-info';
        container.appendChild(tabSizeInfo);

        this.categories = {};
        this.cash = {models: {}};
        let isMobile = this.isMobile = this.deviceCheck();
        this.isAdmin = main.component.urlParams.mode == 'admin';
        if (this.isAdmin)this._datGui = new MyGui(this);
        this.initScene();
        // this.preloader = new Utils.Preloader(this);
        // this._cntxMenu = new CntxMenu(this);
        this.move.isFinish = true;

        //this.loadModel(()=> {})
        this.loadedModels = 0;


        /*let main = this,
         _opt = main.options,
         parentCanvas = this.container,
         onFinish = ()=> {
         this.allLoad = true;
         main.preloader.fade().onUpdatePreloaderStatus(0);
         if (main.options.onFinish)main.options.onFinish(this.model);
         this.zoomCamera();
         if (!this.envMaps[0].maps) {
         let textureCube = this.envLoader.load(this.envMaps[0].urls);
         textureCube.format = THREE.RGBFormat;
         textureCube.mapping = THREE.CubeReflectionMapping;
         this.envMaps[0].maps = textureCube;
         }
         this.model.traverse((child)=> {
         if (child.type == 'Mesh') {
         child.material.envMap = this.envMaps[0].maps;
         }
         });
         };*/
        this._animation = new Animation(this);
        this._events = new MEvents(this);
        // this._transformUI = new TransformControls(this);

        // this.preloader.fade();
    }

    updateHDR(image) {
        if (!this.hdr) {
            var geometry = new THREE.SphereBufferGeometry(500, 60, 40);
            geometry.scale(-1, 1, 1);
            this.hdr = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
            this.hdr.rotation.x = Math.PI;
            this.scene.add(this.hdr);
            this.hdr.visible = false;
        }
        if (image) {
            this.hdr.material.map = this.textureLoader.load(image);
            this.hdr.material.needsUpdate = true;
            /* if (!(this.hdr.material instanceof  THREE.ShaderMaterial)) {
             var loader = new THREE.RGBELoader();
             loader.load(image, (texture, textureData)=> {
             let materialHDR = new THREE.ShaderMaterial({
             side: 2,
             uniforms: {
             tDiffuse: {value: texture},
             exposure: {value: textureData.exposure},
             brightMax: {value: textureData.gamma}
             },
             vertexShader: document.getElementById('vs-hdr').innerText,//Utils.Config.SHADERS.HDR.vert,
             fragmentShader: document.getElementById('fs-hdr').innerText//Utils.Config.SHADERS.HDR.frgmnt

             });
             this.hdr.material = materialHDR;
             this.hdr.material.needsUpdate = true;
             })
             }*/
        }
        if (this.model.radius > 1)this.hdr.scale.set(this.model.radius, this.model.radius, this.model.radius);
    }

    updateTabSizeInfo(size) {
        if (this.tabSizeInfo.timeOutAct)clearTimeout(this.tabSizeInfo.timeOutAct);
        this.tabSizeInfo.innerHTML = 'approximate size in px:<br>' + size.width.toFixed(2) + " x " + size.height.toFixed(2) + " px<br>";
        this.tabSizeInfo.className = 'tab-size-info active';
        this.tabSizeInfo.timeOutAct = setTimeout(()=> {
            this.tabSizeInfo.className = 'tab-size-info';
        }, 5000)

    }

    updateRender(settings) {
        let _set = settings || {};
        _set.clearColor = false;
        _set.preserveDrawingBuffer = true;
        //_set.physicallyCorrectLights = true;
        if (this.gl)_set.canvas = this.gl.domElement;
        let renderer = this.gl = new THREE.WebGLRenderer(_set);
        renderer.toneMapping = THREE.LinearToneMapping;
        for (let _f in _set)renderer[_f] = _set[_f];
        renderer.shadowMap.enabled = true;//!!_set.shadows;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.sortObjects = false;
        renderer.gammaInput = !!_set.gammaInput;
        renderer.gammaOutput = !!_set.gammaOutput;
        if (_set.pixelRatio)renderer.setPixelRatio(_set.pixelRatio);
        if (this.composer)this.composer.renderer = renderer;
    }

    initScene() {
        let scene = this.scene = new THREE.Scene();
        this.model = new THREE.Object3D();
        this.model.name = 'model' + Date.now();
        this.scene.add(this.model);
        this.updateRender({alpha: true, antialias: true, gammaInput: true, gammaOutput: true, shadows: false});
        let _dC = this.main.component.urlParams,
            renderer = this.gl;


        renderer.domElement.className = 'gl-view';
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(this._W(), this._H());
        //renderer.setDepthTest(false);
        //renderer.setClearColor(_self.clearColor = '#8e8e8e', 0);
        //renderer.gammaInput = renderer.gammaOutput = !!location.href.match('withGamma');
        this.anisotropy = renderer.getMaxAnisotropy();
        this.glcontainer.appendChild(renderer.domElement);

        let camera = this.camera = new THREE.PerspectiveCamera(45, this._W() / this._H, 1, 2000);
        this.camera.positionDef = new THREE.Vector3(105, 55, 105);
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
        //this.rs_camera =  new rsdemo.RSCamera();
        //let _d = this.rs_camera.m_transform.m_super.m_world_to_obj;
        //this.controls.addEventListener('change', ()=> {
        //console.log("controls change");
        //this.refresh();
        //this.rs_camera.helper.Update_RS_Camera(0, 0, this.camera, this.controls);
        //console.log(this.camera.position, _d.wx,_d.wy,_d.wz);
        //});

        controls.autoRotate = controls.enableZoom = true;
        controls.enableDamping = true;//!this.isMobile;
        controls.dampingFactor = 0.1;
        //controls.inverseY = true;
        //controls.inverseX = true;
        controls.rotateSpeed = 0.1693;
        controls.rotateSpeedUP = 0.06493;
        //controls.zoomSpeed = 0.87;
        //if (isMobile) controls.zoomSpeed = 1;
        controls.maxPolarAngle = Math.PI * 0.461;
        controls.addEventListener('change', (e)=> {
            this.refresh();
        });
        this.transformControls = new THREE.TransformControls(camera, renderer.domElement);
        this.transformControls.addEventListener('mouseUp', ()=> {
            this.saveJSON();
        });


        // this.renderScene = new THREE.RenderPass(scene, camera);
        //
        // this.effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
        // this.effectFXAA.uniforms['resolution'].value.set(1 / this._W(), 1 / this._H());
        //
        // this.bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(this._W(), this._H()), 1.5, 0.4, 0.85); //1.0, 9, 0.5, 512);
        // this.bloomPass.renderToScreen = true;
        //
        // this.composer = new THREE.EffectComposer(renderer);
        // this.composer.enabled = true;
        // this.composer.setSize(this._W(), this._H());
        // this.composer.addPass(this.renderScene);
        // this.composer.addPass(this.effectFXAA);
        // this.composer.addPass(this.bloomPass);

//floor
        let floor = new THREE.Mesh(new THREE.PlaneBufferGeometry(100, 100), new THREE.MeshPhongMaterial({
            color: 0x80ee10,
            shininess: 100,
            side: THREE.DoubleSide
        }));
        floor.castShadow = floor.recieveShadow = true;
        floor.rotation.x = Math.PI / 2;
        scene.add(floor);

        this.addLights();
        this.loadEnvMaps();
        this.checkIfMapsLoaded({
            val: 3,
            next: (texture)=> {
                scene.background = texture;
            }
        });

    }

    setNewPst(nPosition, cameraRoompst) {
        if (!nPosition)nPosition = this.scene.position;

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
            p3 = this.zoomCamera(null, nPosition, null, ()=> {
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
        if (!model && !this.model.children.length)return;
        if (!nPosition)nPosition = this.model.position;
        let fix = nPosition.fix;
        nPosition = new THREE.Vector3(nPosition.x, nPosition.y, nPosition.z);
        let target = nPosition.clone();
        if (_target)target = _target;
        let radius = this.model.radius;
        if (!radius) {
            radius = this.reCalcRadius();
            //let boxHelper = new THREE.BoxHelper(model || this.model);
            //radius = boxHelper.geometry.boundingSphere.radius;
            //this.model.boxHelper = boxHelper;
            //boxHelper.geometry.computeBoundingBox();
        }

        let sc = 2.2,
            newPst = fix ? nPosition.clone() : nPosition.clone().addScaledVector(this.camera.getWorldDirection().negate(), radius * sc);

        this.model.radius = radius;

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
                onStart: ()=> {
                    this.controls.enabled = true;
                    this.refresh();
                }, onComplete: ()=> {
                    this.refresh();
                    this.controls.minDistance = radius;
                    this.controls.maxDistance = 5 * radius;
                    //this.camera.far = this.controls.maxDistance * 2 * 100;
                    this.camera.updateProjectionMatrix();

                }, list: [{
                    onUpdate: (delta)=> {
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

    refreshProduct(callback) {
        this.model.children = [];
        this.loadModel(callback);
    }

    loadModelByUrl(urlObj, callback) {
        let loader = this._objLoad || new THREE.OBJLoader();
        this._objLoad = loader;
        this.preloader.fade(true).onUpdatePreloaderStatus(0);
        loader.load(urlObj, (object)=> {
            callback(object);
            this.model.userData.url = object.userData.url = this.products[urlObj] = object;
            this.preloader.fade().onUpdatePreloaderStatus(0);
        }, (e)=>this.onProgress(e), (e)=> {
            callback();
            this.onError(e)
        });
    }

    loadModel(callback) {

        let urlObj = this.options.modelName;
        if (urlObj && urlObj.match('.obj')) {
            if (this.products[urlObj]) {
                callback(this._onLoadModel(this.products[urlObj]));
            } else {
                let loader = this._objLoad || new THREE.OBJLoader();
                this._objLoad = loader;
                //loader.crossOrigin = Utils.Config.ACCES_ORIGIN.ANONYM;
                this.preloader.fade(true).onUpdatePreloaderStatus(0);
                loader.load(urlObj, (object)=> {
                    //this.model.userData.url = object.userData.url = this.products[urlObj] = object.clone();
                    object._path = urlObj;
                    callback(this._onLoadModel(object));
                    this.refresh();
                    this.preloader.fade().onUpdatePreloaderStatus(0);
                    this.zoomCamera();
                }, (e)=>this.onProgress(e), (e)=> {
                    callback();
                    this.onError(e)
                });
            }

        }
        else {
            callback();
        }
    }

    _onUploadModel(txt) {
        let loader = this._objLoad || new THREE.OBJLoader();
        this._objLoad = loader;
        let model = loader.parse(txt),
            childs = [];
        model.traverse((child)=> {
            if (child.type == 'Mesh') {
                childs.push(child);
                child.material = this.defMat;
            }
        });
        childs.forEach((el)=> {
            this.model.add(el);
        });
        this.reCalcRadius();
        this.zoomCamera(this.model);
        return childs;
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

    _onLoadModel(object) {

        if (!object || !object.children.length)return;
        let
            params = this.options.params,
            hasToadd,
            objBbox = new THREE.Box3().setFromObject(object),
            bboxCenter = objBbox.getCenter().clone(),
            _material = this.defMat = new THREE.MeshStandardMaterial({
                color: new THREE.Color(1, 1, 1)
            }), key = 0,
            difference = /*this.options.modelTransform.scale ||*/ 1,//new THREE.Vector3(1,1,1),
            commands = [],
            _opt = this.main.options,
            _componet = _opt.component,
            _npst;

        bboxCenter.multiplyScalar(-1);
        if (params) {
            if (params.isReplacement) {
                if (params.modelToChange) {
                    let _objPartBbox = new THREE.Box3().setFromObject(params.modelToChange);
                    _npst = _objPartBbox.getCenter().clone();
                    this.model.remove(params.modelToChange);
                    commands.push(
                        new Command(Command.REQUEST.INSTANCE.DETACH, {
                            instance_name: params.modelToChange.userData.originName
                        })
                    );
                } else {
                    if (this.model.userData.url && this.model.userData.url.match('barware_s11624.obj')) {
                        this.model.children.splice(3, 4).forEach((meshes)=> {
                            commands.push(
                                new Command(Command.REQUEST.INSTANCE.DETACH, {
                                    instance_name: meshes.userData.originName
                                })
                            );
                        });
                    } else if (this.model.isOld) {
                        commands.push(
                            new Command(Command.REQUEST.INSTANCE.DETACH, {
                                instance_name: this.model.children.pop().userData.originName
                            })
                        );
                    }
                }
            }
            this.model.isOld = true;
            let _helper = new THREE.BoxHelper(object),
                radius = _helper.geometry.boundingSphere.radius;
            difference = this.model.radius / radius;
            bboxCenter = this.model.translateO;

        } else {
            this.model.traverse((child)=> {
                if (child.type == Utils.Config.MODELS.TYPES.MESH) {
                    commands.push(
                        new Command(Command.REQUEST.INSTANCE.DETACH, {
                            instance_name: child.userData.originName
                        })
                    );
                }
            });
            this.model.children.splice(1);
            this.model.isOld = this.model.radius = false;
            this.model.translateO = bboxCenter.clone();
        }

        this.checkIfMapsLoaded({
            val: 5,
            next: (texture)=> {

                _material.envMap = texture;
                _material.roughness = _material.metalness = 1.0;
                _material.bumpScale = 0.01;
                _material.envMapIntensity = 1;
                let _texture = this.textureLoader.load('https://threejs.org/examples/textures/roughness_map.jpg');
                _texture.wrapS = THREE.RepeatWrapping;
                _texture.wrapT = THREE.RepeatWrapping;
                _texture.anisotropy = 24;
                let canvas = document.createElement('canvas');
                canvas.width = _texture.image.width;
                canvas.height = _texture.image.height;
                _material.roughnessMap = _texture;
                _material.bumpMap = _texture;
                _material.needsUpdate = _texture.needsUpdate = true;

                this.model.traverse((child)=> {

                    if (child.material) {
                        //child.material=new THREE.MeshStandardMaterial({
                        //    color: new THREE.Color(1, 1, 1)
                        //}) ;
                        child.material = _material.clone();
                        child.material.envMap = texture;
                        child.material.roughness = _material.metalness = 1.0;
                        child.material.bumpScale = 0.01;
                        child.material.envMapIntensity = 1;
                        child.material.roughnessMap = _texture;
                        child.material.bumpMap = _texture;
                        child.material.needsUpdate = true;
                    }
                })
            }
        });

        let _childs = [];
        object.traverse((child)=> {
            if (child.type == Utils.Config.MODELS.TYPES.MESH) {
                if (!this.cash.models[object._path + child.name])this.cash.models[object._path + child.name] = child;
                //child.geometry.translate(bboxCenter.x, bboxCenter.y, bboxCenter.z);
                if (!child.userData.originName) child.userData.originName = child.name;
                if (!child.userData.originParent) child.userData.originParent = object._path;
                child.name = child.userData.name = (!params ? 'Mesh_part_' : 'Custom_part_') + (this.loadedModels++);
                child.receiveShadow = child.castShadow = true;
                //child.material = _material.clone();
                //child.material = _material;
                child._canTransform = true;
                child.renderOrder = 1;
                child.category = Utils.Config.MODELS.TYPES._MESH;
                child.material.name = Utils.Config.randomstr();
                _childs.push(child);
                if (params) {
                    child.canTransform = true;
                    let _sc = this.model.children[1].scale.x;
                    if (params.transform) {
                        //child.matrix.elements = params.transform;
                        //child.matrix.decompose(child.position, child.quaternion, child.scale);
                    } else {
                        child.scale.set(params.scale.x * _sc, params.scale.y * _sc, params.scale.z * _sc);
                        if (_npst) {
                            child.position.copy(_npst);
                        } else {
                            child.position.set((params.position.x + bboxCenter.x) * _sc, (params.position.y + bboxCenter.y) * _sc, (params.position.z + bboxCenter.z) * _sc);
                        }

                        child.rotation.x = THREE.Math.degToRad(params.rotation.x);
                        child.rotation.y = THREE.Math.degToRad(params.rotation.y);
                        child.rotation.z = THREE.Math.degToRad(params.rotation.z);
                    }
                    child.params = params;
                    if (!params.listParts)params.listParts = [];
                    params.listParts.push(child);

                } else {
                    child.position.set(bboxCenter.x * difference, bboxCenter.y * difference, bboxCenter.z * difference);
                    child.scale.multiplyScalar(difference);
                }
                if (_componet)_componet.showGlyphicon[key] = true;
            }
        });
        this.transformControls.detach();
        _childs.forEach((el)=> {

            //if (params && el.canTransform) {
            //    this.scene.remove(this.transformControls);
            //    this.transformControls.attach(el);
            //    this.model.add(this.transformControls.object);
            //    this.scene.add(this.transformControls);
            //} else {
            this.model.add(el);
            //}
        });
        _material.needsUpdate = true;
        object.name += 'loaded_model';
        this.reCalcRadius();
        return commands;
    }

    _onExportModel() {
        let exporter = this.exporter = this.exporter || new THREE.OBJExporter(),
            result = exporter.parse(this.model),
            a = document.createElement('a'),
            type = "text/plain;charset=utf-8";
        this.exporter = exporter;

        let _form = new FormData(),
            blob1 = new Blob([result.obj], {type: type}),
            blob2 = new Blob([result.mtl], {type: type});
        _form.append('models[]', blob1, 'model.obj');
        _form.append('models[]', blob2, 'model.mtl');
        for (let i = 0; i < result.images.length; i++) {
            let _img = result.images[i];
            _form.append('maps[]', this._b64toBlob(_img.img, 'image/*'), _img.name);
        }

        return {form: _form, result: result};
    }

    _b64toBlob(b64Data, contentType, sliceSize, onEnd) {
        //if (b64Data instanceof Image) {
        var canvas = document.createElement("canvas");
        canvas.width = b64Data.width;
        canvas.height = b64Data.height;

        var ctx = canvas.getContext("2d");
        ctx.drawImage(b64Data, 0, 0);

        //return canvas.toBlob(onEnd);
        b64Data = canvas.toDataURL().split(",")[1];
        //}
        contentType = contentType || '';
        sliceSize = sliceSize || 512;

        var byteCharacters = atob(b64Data);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        var blob = new Blob(byteArrays, {type: contentType});
        return blob;
    }

    updateSceneMeshMatrix(onlyInner) {
        let commands = [],
            curStorage = onlyInner ? this.innerModel : this.model;
        if (curStorage) {
            curStorage.traverse((child)=> {
                if (child.type == Utils.Config.MODELS.TYPES.MESH) {
                    let nName = child.name + "_clone_" + (this.loadedModels++),
                        _mat = this.main.component.commands.materials[child.userData.originName];
                    commands.push(
                        new Command(Command.REQUEST.ELEMENT.COPY, {
                            "source_name": child.name,//child.userData.originName,
                            "target_name": nName
                        }),
                        new Command(Command.REQUEST.GROUP.ATTACH, {
                            group_name: Command.SCENE.MAIN_GROUP,
                            item_name: nName
                        }),
                        new Command(Command.REQUEST.INSTANCE.WORLD_TO_OBJ, {
                            "instance_name": nName,
                            "transform": child.getMatrixR(onlyInner)
                        })
                    );
                    if (_mat) {
                        //commands.push(new Command(Command.REQUEST.INSTANCE.SET_MATRL,
                        //    {
                        //        "instance_name": nName,
                        //        "material_name": _mat.name,
                        //        "override": true
                        //    }
                        //));
                    }
                }
            });
        }

        return commands;
    }

    loadEnvMaps() {
        /*---------env maps--------*/
        var imgSrc = Utils.Config.REMOTE_DATA + Utils.Config.IMG_STORAGE + "env/",
            textureLoader = this.textureLoader = new THREE.TextureLoader(),
            envs = this.envMaps =
                [
                    {
                        url: 'garage/',
                        type: '.jpg',
                        dirs: ['positiveX', 'negativeX', 'positiveY', 'negativeY', 'positiveZ', 'negativeZ']
                    },
                    {url: 'sb_frozen/frozen_', type: '.png', dirs: ['ft', 'bk', 'up', 'dn', 'rt', 'lf']},
                    {url: 'studiobox/', type: '.png', dirs: ['px', 'nx', 'py', 'ny', 'pz', 'nz']},
                    {url: 'skybox/', type: '.jpg', dirs: ['posx', 'negx', 'posy', 'negy', 'posz', 'negz']},
                    {url: 'bridge/', type: '.jpg', dirs: ['posx', 'negx', 'posy', 'negy', 'posz', 'negz']},
                    {url: 'pisaHDR/', type: '.hdr', dirs: ['px', 'nx', 'py', 'ny', 'pz', 'nz']}
                ];
        textureLoader.crossOrigin = Utils.Config.ACCES_ORIGIN.ANONYM;
        textureLoader.setCrossOrigin(Utils.Config.ACCES_ORIGIN.ANONYM);

        //THREE.ImageUtils.crossOrigin = Utils.Config.ACCES_ORIGIN.ANONYM;
        for (let key = 0; key < envs.length; key++) {
            let e = envs[key],
                src = imgSrc + e.url,
                fType = e.type,
                directions = e.dirs,
                urls = [];
            for (let i = 0; i < 6; i++) {
                let url = src + directions[i] + fType;
                urls.push(url);
            }
            //var textureCube = envLoader.load(urls);
            //textureCube.format = THREE.RGBFormat;
            //textureCube.mapping = THREE.CubeReflectionMapping;
            //e.maps = textureCube;
            e.name = key;
            e.urls = urls;

        }
    }

    checkIfMapsLoaded(opt) {
        let val = opt.val,
            curMap = this.envMaps[val],
            next = (text)=> {
                if (opt.next)opt.next(text);
            };
        if (!curMap.maps) {
            if (curMap.type == '.hdr') {
                if (!this.hdrLoader) {
                    this.hdrLoader = new THREE.HDRCubeTextureLoader();
                }
                this.hdrLoader.load(THREE.UnsignedByteType, curMap.urls, (hdrCubeMap) => {
                    let pmremGenerator = new THREE.PMREMGenerator(hdrCubeMap);
                    pmremGenerator.update(this.gl);

                    let pmremCubeUVPacker = new THREE.PMREMCubeUVPacker(pmremGenerator.cubeLods);
                    pmremCubeUVPacker.update(this.gl);

                    //hdrCubeRenderTarget = pmremCubeUVPacker.CubeUVRenderTarget;

                    curMap.maps = pmremCubeUVPacker.CubeUVRenderTarget.texture;
                    next(curMap.maps);
                });
            } else {
                if (!this.envLoader) {
                    this.envLoader = new THREE.CubeTextureLoader();
                    this.envLoader.setCrossOrigin(Utils.Config.ACCES_ORIGIN.ANONYM);
                    this.envLoader.crossOrigin = Utils.Config.ACCES_ORIGIN.ANONYM;
                }
                let textureCube = this.envLoader.load(this.envMaps[val].urls);
                textureCube.format = THREE.RGBFormat;
                textureCube.mapping = THREE.CubeReflectionMapping;
                textureCube.anisotropy = this.gl.getMaxAnisotropy();
                curMap.maps = textureCube;
                next(textureCube);
            }

        } else {
            next(curMap.maps);
        }
    }

    addLights() {
        /*-------lights--------*/
        this.lights = new THREE.Object3D();

        this.scene.add(this.lights);

        this.changes = [
            ['position', 'quaternion', 'scale', 'category'],
            ['intensity', 'distance', 'decay', 'color', 'angle', 'penumbra', 'visible', 'skyColor', 'groundColor', 'castShadow']
        ]
        try {
            let data = MStorage.getItem('data');
            if (data) {

                for (let i = 0; i < data.lights.length; i++) {
                    let _l = data.lights[i],
                        _el = this.createLight(_l.category, _l);
                    if (this._datGui)this._datGui.addlight(_el);
                }

                for (let i = 0; i < data.shapes.length; i++) {
                    let _l = data.shapes[i],
                        _el = this.createShape(_l.category, _l);
                    if (this._datGui)this._datGui.addShape(_el);
                }
            }else{
                let _el = this.createLight(5);
                if (this._datGui)this._datGui.addlight(_el);
            }
        } catch (e) {
            let _el = this.createLight(5);
            if (this._datGui)this._datGui.addlight(_el);
        } finally {
            if (this.main.options.helper)this.scene.add(new THREE.AxisHelper(500));
        }


    }

    saveJSON() {
        let _g = this.changes[0],
            _l = this.changes[1],
            result = {lights: [], shapes: []};
        this.lights.traverse((child)=> {
            if (child instanceof THREE.Light) {
                let _light = {};
                for (let i = 0; i < _g.length; i++) {
                    if (child[_g[i]] !== undefined)_light[_g[i]] = child[_g[i]];
                }
                for (let i = 0; i < _l.length; i++) {
                    let _cur = _l[i];
                    if (child[_l[i]] !== undefined) {
                        if (_cur.toLowerCase().match('color')) {
                            _light[_cur] = "#" + child[_cur].getHexString();
                        } else {
                            _light[_cur] = child[_cur];
                        }

                    }
                }
                result.lights.push(_light)
            }
        });
        this.model.traverse((child)=> {
            if (child.MODE == 1) {
                let _shape = {};
                for (let i = 0; i < _g.length; i++) {
                    if (child[_g[i]] !== undefined)_shape[_g[i]] = child[_g[i]];
                }
                result.shapes.push(_shape)
            }
        })

        MStorage.setItem('data', result);
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
                    for (let f in settings[_l])light[_l][f] = settings[_l][f];
                }

                for (let i = 0; i < _gL.length; i++) {
                    let _l = _gL[i];
                    if (settings[_l] == undefined)continue;
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
                    for (let f in settings[_l])shape[_l][f] = settings[_l][f];
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
        if (this._animation)this._animation.play(true);
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
        RayCast.setFromCamera({x: 0, y: 0}, this.camera);
        newAngle = this.toV2({x: 0, y: 0}, {x: RayCast.ray.direction.x, y: RayCast.ray.direction.z});
        curentRotationInRad = ( ( -Math.PI / 2 + -newAngle ) + (Math.PI * 2) ) % ( Math.PI * 2 );
        nRotation = ( curentRotationInRad + ((Math.PI / 180) * rotation)  );
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

    uploadModel(model_name, onFinish, needMaterials, onError) {
        let _self = this,
            mtlLoader = _self.mtlLoader,
            objLoader = _self.objLoader,
            onFinishE = (d)=> {

                onFinish(d);
                //this.controls.enabled = true;
                //if(_self.animation)_self.animation.play();
            }, onErrorE = (xhr)=> {

                if (onError)onError(xhr);
                _self.onError(xhr);
                //this.controls.enabled = true;
                //if(_self.animation)_self.animation.play();
            };

        //this.controls.enabled = false;
        //if(_self.animation)_self.animation.stop();
        if (!objLoader.iter)objLoader.iter = 0;
        objLoader.iter++;
        this.model_name = model_name;
        this.totalLoaded = this.curLoadedItems / this.maxLoadedItems;
        this.curLoadedItems++;
        if (needMaterials) {
            mtlLoader.setPath(_self.model_path);
            mtlLoader.load(model_name + 'mtl', function (materials) {
                materials.preload();
                objLoader.setMaterials(materials);
                objLoader.setPath(_self.model_path);
                objLoader.load(model_name + 'obj', (e)=> {
                    _self.onProgress({loaded: 1, total: 1});
                    onFinishE(e), (xhr)=>_self.onProgress(xhr), onErrorE
                });
            });
        } else {
            objLoader.setPath(_self.model_path);
            objLoader.load(model_name + 'obj', (e)=> {
                _self.onProgress({loaded: 1, total: 1});
                onFinishE(e), (xhr)=>_self.onProgress(xhr), onErrorE
            }, (xhr)=> {
                _self.onProgress(xhr);
            }, onErrorE);
        }

    }

    isTranparent(mat) {
        return mat.opacity < 1 && this._datGui.controls.transparent.transparent && !this.isMobile && this.noNeedToDisableTransparent.indexOf(mat.name) < 0
    }

    toggleBtns(flag = false) {
        [].forEach.call(document.querySelector('.m-footer>.controls').childNodes, (node, item)=> {
            if (node.getAttribute) {
                if (node.getAttribute(this.events.ATTRIBUTES.ONLY_EXTERIER)) {
                    node.style.display = flag ? '' : 'none';
                } else if (node.getAttribute(this.events.ATTRIBUTES.ONLY_INTERIER)) {
                    node.style.display = flag ? 'none' : '';
                }
            }
        });
    }

    cloneVertices(arr) {
        let result = [];
        for (var i = 0; i < arr.length; i++) {
            result.push(arr[i].clone());
        }
        return result;
    }

    move(arg) {
        let _self = this,
            controls = this.controls;
        if (!this.move.isFinish)return;
        this.refresh();
        let duration = arg.duration || 900,
            tween = new TWEEN.Tween({delta: 0}).to({delta: 1}, duration)
                .easing(TWEEN.Easing.Exponential.In)
                .onStart(()=> {
                    controls.enabled = this.move.isFinish = /*this.personControls.enabled = */false;
                    if (arg.onStart)arg.onStart();
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
                    if (arg.onComplete)arg.onComplete();
                })
                .start()
            ;

    }

    setMode(enable) {
        let _cntls = this.controls,
            isVR = enable || !this.stereo.isVr,
            controlObj = _cntls.object,
            isnotFlat = !this.flatLevel,
            conductor = controlObj.parentControl;


        if (isVR) {

            //controlObj.position.copy(controlObj.pstDefault);
            _cntls.lastTarget = this.area.position.clone();
            if (isnotFlat) {

                _cntls.lastMinDistance = _cntls.minDistance;
                _cntls.minDistance = 1;
                let dir = new THREE.Vector3().subVectors(_cntls.target.clone(), controlObj.position.clone()).normalize(),
                    dist = controlObj.position.distanceTo(_cntls.target);

                controlObj.position.addScaledVector(dir, dist * this.stereo.deltaZoom);
                _cntls.target.copy(controlObj.position.clone().addScaledVector(dir, 1));


                //var lastDir = dir,
                //    dist = _cntls.target.distanceTo(_cntls.lastTarget) * 0.5;
                //_cntls.target.addScaledVector(lastDir, dist);
                //controlObj.position.addScaledVector(lastDir, dist);
                //controlObj.position.addScalarVector(dir,_self.stereo.deltaZoom);
                controlObj.lastAngle = Math.acos(controlObj.position.x / controlObj.position.distanceTo(_cntls.lastTarget));
            }

        } else {


            if (isnotFlat) {
                if (this.controls.lastMinDistance)this.controls.minDistance = this.controls.lastMinDistance;
                _cntls.target.copy(this.scene.position);

                let dir = new THREE.Vector3().subVectors(_cntls.target.clone(), controlObj.position.clone()).normalize(),
                    dist = controlObj.position.distanceTo(_cntls.target);
                controlObj.position.addScaledVector(dir.negate(), dist);

            }
        }
        //_cntls.maxPolarAngle = isVR || !isnotFlat ? Math.PI : Math.PI * 0.51;
        if (isnotFlat) {
            _cntls.inverse = isVR;
            _cntls.deviceVR = isVR;
            _cntls.device = isVR;
        }
        //_cntls.inverseY = false;//this.isMobile && isVR;

        //this.stereo = this.stereo || new THREE.OculusRiftEffect(this.renderer);
        this.stereo.isVr = isVR;
        this.vr.show(isVR, isnotFlat);
        this.onWindowResize();


    }

    deviceCheck() {
        var check = false;
        (function (a) {
            if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
        })(navigator.userAgent || navigator.vendor || window.opera);
        return check;
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
        this.model.traverse((mesh)=> {
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
        for (let i = 0; i < this.animations.length; i++) {
            this.animations[i]();
        }
        if (this.canAnimate  /*&& (!this.main.isMobile || ( this.main.isMobile && this.lastIter++ > 2))*/) {

            this.canAnimate = this.lastUpdate > Date.now();
            if (!this.canAnimate || this.lastIter > 2)this.lastIter = 0;
            this.main.render();
        }
        //this.stats.end();
        requestAnimationFrame(() => {
            this.animate();
        });
    }

    play(flag) {
        this.lastUpdate = Date.now() + ( this.maxTimeUpdate);
        if (this.canAnimate) return;
        this.canAnimate = flag;//|| !Pace.running;
    }

    stop() {
        this.canAnimate = false;
        this.lastIter = 0;
    }
}
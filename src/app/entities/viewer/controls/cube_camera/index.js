import GUtils from "../../../utils";
import {GLMain} from "../../glMain";

export default class CubeCameraView {
    constructor(parent) {
        let size = this.size = 100,
            scene = this.scene = new THREE.Scene(),
            renderer = this.renderer = this.gl = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true
            }),
            camera = this.camera = new THREE.PerspectiveCamera(45, size / size, 0.1, 200),
            cube = this.cube = new THREE.Object3D();

        camera.up = new THREE.Vector3(0,0,1);
        this.camera.updateProjectionMatrix();
        renderer.sortObjects = false;
        renderer.setSize(size, size);
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.className = "cube-camera";
        let controls = this.controls = new THREE.OOrbitControls(camera, renderer.domElement);
        controls.enableDamping =
            controls.enableKeys =
                controls.enablePan =
                    controls.enableZoom =
                        controls.inverse = false;
        controls.rotateSpeed = 0.51693;
        controls.rotateSpeedUP = 0.26493;
        this._initCube();
        let helper = new THREE.BoxHelper(this.cube, GUtils.COLORS.EDGE_1),
            cameraDefaultPst = new THREE.Vector3();
        cameraDefaultPst.addScaledVector(new THREE.Vector3(1, 1, 1), helper.geometry.boundingSphere.radius * 1.5);
        camera.position.copy(cameraDefaultPst);
        this._addLights();

        scene.add(cube);
        scene.rotation.x = Math.PI/2;
        this.scene.add(helper);
        this._events = new CubeEvents(this);
    }

    update() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    _addLights() {
        let light1 = new THREE.AmbientLight(0xffffff, 0.81);
        let light = new THREE.SpotLight(0xffffff, 0.141);
        light.position.set(5, 5, -5);
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

        this.scene.add(light1);
        this.scene.add(light);
    }

    _initCube() {
        let
            self = this,
            edges = [
                {
                    title: 'Top',
                    position: new THREE.Vector3(0, 1, 0),
                    rotation: [
                        new THREE.Vector3(-1, 0, 0),
                        new THREE.Vector3(0, 0, 1)
                    ]
                },
                {
                    title: 'Bottom',
                    position: new THREE.Vector3(0, -1, 0),
                    rotation: [
                        new THREE.Vector3(1, 0, 0),
                        new THREE.Vector3(0, 0, -1)
                    ]
                },
                {
                    title: 'Left',
                    position: new THREE.Vector3(0, 0, 1)
                },
                {
                    title: 'Right',
                    position: new THREE.Vector3(0, 0, -1),
                    angle: Math.PI,
                    rotation: [
                        new THREE.Vector3(-1, 0, 0),
                        new THREE.Vector3(0, 0, 1)
                    ]
                },
                {
                    title: 'Back',
                    position: new THREE.Vector3(1, 0, 0),
                    rotation: [
                        new THREE.Vector3(0, 1, 0)
                    ]
                },
                {
                    title: 'Front',
                    position: new THREE.Vector3(-1, 0, 0),
                    rotation: [
                        new THREE.Vector3(0, -1, 0)
                    ]
                }
            ].forEach(((eddge) => {
                let plane = new THREE.PlaneBufferGeometry(1, 1, 1),
                    materiial = new THREE.MeshPhongMaterial({
                        map: this._drawTexture({text: eddge.title})
                    }),
                    cubeEdge = new THREE.Mesh(plane, materiial);
                cubeEdge.scale.multiplyScalar(2);
                this.cube.add(cubeEdge);
                if (eddge.rotation) {

                    while (eddge.rotation.length) {
                        let quaternion = new THREE.Quaternion();
                        quaternion.setFromAxisAngle(eddge.rotation.shift(), eddge.angle || Math.PI / 2);
                        cubeEdge.quaternion.multiply(quaternion);
                    }

                }
                cubeEdge._edge = eddge;
                cubeEdge.position.copy(eddge.position);
                cubeEdge._category = CubeCameraView.CATEGORES.EDGE;
                cubeEdge.isIntersectable = true;
                cubeEdge._mouseover = function (e) {
                    if (!this.material.defColor) {
                        this.material.defColor = this.material.color.clone()
                    }
                    if (!this.isHovered) {
                        this.material.color.addScalar(0.25);
                    }

                    this.isHovered = true;
                }
                cubeEdge._mouseout = function (e) {
                    this.material.color = this.material.defColor.clone();
                    this.isHovered = false;
                }
                cubeEdge._mouseup = function (e) {
                    cubeEdge._mouseout();
                    self.onSelectView(this._edge);
                }

            }))
    }

    static CATEGORES = {
        EDGE: 1
    }

    _drawTexture({text}) {
        let canvas = document.createElement('canvas');
        canvas.width = canvas.height = 512;
        let context = canvas.getContext('2d'),
            fontSize = 140;

        context.fillStyle = '#ececf0';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = `${fontSize}px Arial`;
        context.textBaseline = "middle";
        context.textAlign = "center";
        context.fillStyle = 'black';
        context.fillText(text, canvas.width * 0.5, canvas.height * 0.5);

        let texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    refresh() {

    }

    onSelectView(view) {
        this.camera.position.copy(this.controls.target.clone().addScaledVector(view.position, this.camera.position.distanceTo(this.controls.target)));
        if(this.onChangeView)this.onChangeView(view);
    }
}


class CubeEvents extends GLMain {
    constructor(main) {
        super();
        this.main = main;
        this.EVENTS_NAME = this.Utils.Config.EVENTS_NAME;
        this.mouse = new MMouse(main);
        this.raycaster = new THREE.Raycaster();

        let _self = this,
            elem = main.gl.domElement,
            handler = (elem.addEventListener || elem.attachEvent).bind(elem);

        if (main.isMobile) {
            handler(this.EVENTS_NAME.TOUCH_START, (e) => this.onMouseDown(e));
            handler(this.EVENTS_NAME.TOUCH_END, (e) => this.onMouseUp(e));
            handler(this.EVENTS_NAME.TOUCH_MOVE, (e) => this.onMouseMove(e));
        } else {
            handler(this.EVENTS_NAME.MOUSE_DOWN, (e) => this.onMouseDown(e));
            handler(this.EVENTS_NAME.MOUSE_UP, (e) => this.onMouseUp(e));
            handler(this.EVENTS_NAME.MOUSE_MOVE, (e) => this.onMouseMove(e));
        }


    }

    onMouseDown(e) {
        this.mouse.down = e
    }

    onMouseMove(ev) {
        let noMouseDown = !this.mouse.down,
            _el = this._lastSelectedMesh,
            _elH = this.lastHovered;
        this.mouse.hasMove = !noMouseDown;
        this.lastSelectedMesh = this.lastHovered = null;
        this.main.refresh();

        if (noMouseDown) {
            if (_elH) {
                _elH._mouseout(ev);
            }

            this.onSelected(ev, (inters) => {
                document.body.style.cursor = inters.length ? 'pointer' : '';
                if (inters && inters.length) {
                    let element = this.lastHovered = inters[0].object;

                    switch (element._category) {
                        case CubeCameraView.CATEGORES.EDGE: {
                            element._mouseover(ev);
                            break;
                        }
                    }
                }
            });
        }
    }

    onMouseUp(ev) {
        if (!this.mouse.hasMove) {
            this.onSelected(ev, (inters) => {
                if (inters && inters.length) {
                    let element = this.lastHovered = inters[0].object;
                    switch (element._category) {
                        case CubeCameraView.CATEGORES.EDGE: {
                            element._mouseup(ev);
                            break;
                        }
                    }
                }
            });
        }

        this.mouse.down = this.mouse.hasMove = null;
    }

    onSelected(ev, callback) {
        let intersectList = this.inter(ev);
        if (intersectList) {
            intersectList = intersectList.filter((el) => {
                return el.object.isIntersectable
            });
            if (intersectList[0]) {
                this.lastInter = intersectList[0];
            }
        }

        callback(intersectList);
    }

    inter(ev, arg = null) {
        let _self = this,
            elements = arg && arg.childs ? arg.childs : _self.main.scene.children;

        if (!elements) return false;
        if (arg && arg.position) {
            let direction = new THREE.Vector3().subVectors(arg.target, arg.position);
            _self.raycaster.set(arg.position, direction.clone().normalize());
        } else {
            let
                mouseVector = _self.mouse.interPoint(ev);
            _self.raycaster.setFromCamera(mouseVector.webgl, _self.main.camera);
            // this.lastMousePst = mouseVector.html;
        }

        return _self.raycaster.intersectObjects(elements, true);
    }
}

export class MMouse {

    constructor(main) {
        this.isDown = false;
        this.main = main;
    }

    interPoint(ev) {
        let _slider = this.main.gl.domElement,
            rect = _slider.getBoundingClientRect(),
            canvasW = _slider.clientWidth,
            canvasH = _slider.clientHeight,
            _x = (ev ? (ev.touches ? ev.touches[0].pageX : ev.clientX) : canvasW / 2) - rect.left,
            _y = (ev ? (ev.touches ? ev.touches[0].pageY : ev.clientY) : canvasH / 2) - rect.top
        ;


        return {
            webgl: new THREE.Vector2(((_x) / canvasW) * 2 - 1, -((_y) / canvasH) * 2 + 1),
            html: new THREE.Vector2(_x, _y)
        };
    }

}
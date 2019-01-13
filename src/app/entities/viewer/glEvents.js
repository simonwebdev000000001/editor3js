import {GlViewer} from "./glViewer.js";
import {GLMain} from "./glMain.js";
import GUtils from "../utils";
import PointerConductor from "./controls/pointer_conductor";


import BoxControls from './controls/box';
import {Utils} from "../../utils";

/**
 * @class events for canvas viewver and some events for buttons
 * */
export class MEvents extends GLMain {

    /**
     * @param {GlViewer} main
     * */
    constructor(main) {
        super();
        this.main = main;
        this.TOOL = -1;
        this.EVENTS_NAME = this.Utils.Config.EVENTS_NAME;
        this._pointerConductor = new PointerConductor();
        main.scene.add(this._pointerConductor.container);
        this.mouse = new MMouse(main);
        this.raycaster = new THREE.Raycaster();
        this.pathOnMove = 50;
        this.keyCode = [];
        let _self = this,
            elem = main.gl.domElement,
            handler = (elem.addEventListener || elem.attachEvent).bind(elem),
            fullscreenEl = document.createElement('span');
        fullscreenEl.className = "glyphicon glyphicon-fullscreen fullscreen";
        fullscreenEl.addEventListener(this.EVENTS_NAME.CLICK, (e) => {
            this.toggleFullscreen();
        });
        // main.container.appendChild(fullscreenEl);
        if (main.isMobile) {
            handler(this.EVENTS_NAME.TOUCH_START, (e) => this.onMouseDown(e));
            handler(this.EVENTS_NAME.TOUCH_END, (e) => this.onMouseUp(e));
            handler(this.EVENTS_NAME.TOUCH_MOVE, (e) => this.onMouseMove(e));
        } else {
            handler(this.EVENTS_NAME.MOUSE_DOWN, (e) => this.onMouseDown(e));
            handler(this.EVENTS_NAME.MOUSE_UP, (e) => this.onMouseUp(e));
            handler(this.EVENTS_NAME.MOUSE_MOVE, (e) => this.onMouseMove(e));
            handler(this.EVENTS_NAME.MOUSE_OUT, (e) => this.onMouseOut(e));
        }


        handler(this.EVENTS_NAME.DRAG_OVER, (e) => this.onDragOver(e));
        handler(this.EVENTS_NAME.DRAG_OUT, (e) => this.onDragOut(e));
        handler(this.EVENTS_NAME.DRAG_END, (e) => this.onDrop(e));

        handler(this.EVENTS_NAME.DB_CLICK, (e) => this.onDbClick(e));
        handler(this.EVENTS_NAME.SELECT_START, this.Utils.Config.onEventPrevent);
        // handler(this.EVENTS_NAME.DRAG.DROP, (e) => this.onDrop(e));
        handler(this.EVENTS_NAME.DRAG.OVER, this.Utils.Config.onEventPrevent);
        handler(this.EVENTS_NAME.FULLSCREEN.WEB_KIT, (e) => this.onfullscreenchange(e));
        handler(this.EVENTS_NAME.FULLSCREEN.MOZ, (e) => this.onfullscreenchange(e));
        handler(this.EVENTS_NAME.FULLSCREEN.DEF, (e) => this.onfullscreenchange(e));
        handler(this.EVENTS_NAME.CNTXMENU, (e) => this.onCntxMenu(e));


        this.events_storage = [
            {elem: window, eventName: this.EVENTS_NAME.RESIZE, callback: () => this.onWindowResize()},
            {
                elem: window, eventName: this.EVENTS_NAME.KEY.DOWN, callback: (e) => this.onKeyDown(e)
            },
            {
                elem: window, eventName: this.EVENTS_NAME.KEY.UP, callback: (e) => this.onKeyUp(e)
            }
        ].filter(function (ev) {
            let handler = (ev.elem.addEventListener || ev.elem.attachEvent).bind(ev.elem);
            handler(ev.eventName, ev.callback, false);
            return true;
        });

        this.onWindowResize();
    }


    onDragOver(ev) {
        if (!this.main.gl.domElement.parentNode.className.match('dragover')) {
            this.main.gl.domElement.parentNode.className += ' dragover';
        }
        return this.Utils.Config.onEventPrevent(ev, true);
    }

    onDragOut(ev) {
        this.main.gl.domElement.parentNode.className = this.main.gl.domElement.parentNode.className.replace(' dragover', "");
        return this.Utils.Config.onEventPrevent(ev, true);
    }

    onDrop(ev) {
        this.main.gl.domElement.parentNode.className = this.main.gl.domElement.parentNode.className.replace(' dragover', "");
        let _files = ev.dataTransfer.items;
        if (_files) {
            for (var i = 0; i < _files.length; i++) {
                if (_files[i].kind === 'file') {
                    var file = _files[i].getAsFile();
                    this.main.loadStlFile(URL.createObjectURL(file), file.name);
                }
            }
        } else {
            for (var i = 0; i < _files.length; i++) {
                let file = _files[i];
                this.main.loadStlFile(URL.createObjectURL(file), file.name);
            }
        }

        return this.Utils.Config.onEventPrevent(ev, true);
    }

    onDestroy() {
        while (this.events_storage.length) {
            let ev = this.events_storage.shift();
            let handler = (ev.elem.removeEventListener || ev.elem.dispatchevent).bind(ev.elem);
            handler(ev.eventName, ev.callback);
        }
    }

    onKeyUp(event) {
        let _self = this,
            main = this.main,
            control = main.transformControls,
            keyCode = event.keyCode,
            keyIndex = _self.keyCode.indexOf(keyCode);

        if (keyIndex > -1) _self.keyCode.splice(keyIndex, 1);
        // _self.keyCode = []; 
        switch (keyCode) {
            case 17: {
                if (control) {
                    // control.setTranslationSnap(null);
                    // control.setRotationSnap(null);
                }
                break;
            } // Ctrl


            case 16: // SHIFT
                main.controls.enabled = true;
                break;
                // case 46: { // Del
                //     if (main._datGui) {
                //         if (confirm('Are you sure you want to delete these files?')) {
                //             main._datGui.deleteSelected();
                //         }
                //     }
                // }
                break;
        }
    }

    onKeyDown(event) {

        let _self = this,
            main = this.main,
            control = main.transformControls,
            keyCode = event.keyCode;
        if (_self.keyCode.indexOf(keyCode) < 0) _self.keyCode.push(event.keyCode);
        // console.log(event.keyCode);

        if (_self.keyCode.indexOf(16) > -1) {
            switch (keyCode) {
                case 37: {//Left
                    if (control && control.tempParent) {
                        control.tempParent.position.y += GUtils.CONTROLS.INCREMENTS.KEYBOARD_TRANSLATE;
                        return this.Utils.Config.onEventPrevent(event, true);
                    }
                    break;
                }
                case 39: {//Top
                    if (control && control.tempParent) {
                        control.tempParent.position.y -= GUtils.CONTROLS.INCREMENTS.KEYBOARD_TRANSLATE;
                        return this.Utils.Config.onEventPrevent(event, true);
                    }
                    break;
                }
            }
        }
        switch (event.keyCode) {

            case 46: {//Del

                this.onDeleteSelectedPart(event);
                break;
            }
            case 37: {//Left
                if (control && control.tempParent) {
                    control.tempParent.position.x -= GUtils.CONTROLS.INCREMENTS.KEYBOARD_TRANSLATE;
                    return this.Utils.Config.onEventPrevent(event, true);
                }
                break;
            }
            case 38: {//Top
                if (control && control.tempParent) {
                    control.tempParent.position.z += GUtils.CONTROLS.INCREMENTS.KEYBOARD_TRANSLATE;
                    return this.Utils.Config.onEventPrevent(event, true);
                }
                break;
            }
            case 39: {//Right
                if (control && control.tempParent) {
                    control.tempParent.position.x += GUtils.CONTROLS.INCREMENTS.KEYBOARD_TRANSLATE;
                    return this.Utils.Config.onEventPrevent(event, true);
                }
                break;
            }
            case 40: {//Down
                if (control && control.tempParent) {
                    control.tempParent.position.z -= GUtils.CONTROLS.INCREMENTS.KEYBOARD_TRANSLATE;
                    return this.Utils.Config.onEventPrevent(event, true);
                }
                break;
            }
            case 27: {
                if (main.transformControls.object) {
                    let transformControls = main.transformControls;
                    transformControls.detach();
                    main.scene.remove(transformControls);
                }
                break;
            } // ESC

            case 81: // Q
                if (main.transformControls) {
                    main.transformControls.setSpace(main.transformControls.space == 'world' ? "local" : "world");
                }
                break;

            case 16: // SHIFT
            // main.controls.enabled = false;

            case 17: // Ctrl
                if (main.transformControls) {
                    // main.transformControls.setTranslationSnap(100);
                    // main.transformControls.setRotationSnap(THREE.Math.degToRad(15));
                }

                break;
            case 18: {//Alt

                break;
            }

            case 87: // W
                if (main.transformControls) main.transformControls.setMode("translate");
                break;

            case 69: // E
                // if (main.transformControls) main.transformControls.setMode("rotate");
                break;

            case 82: // R
                // if (main.transformControls) main.transformControls.setMode("scale");
                break;

            case 187:
            case 107: // +, =, num+
                if (main.transformControls) main.transformControls.setSize(main.transformControls.size + 0.1);
                break;

            case 189:
            case 109: // -, _, num-
                if (main.transformControls) main.transformControls.setSize(Math.max(main.transformControls.size - 0.1, 0.1));
                break;
            case 88: // X
                if (control) control.showX = !control.showX;
                break;

            case 89: // Y
                if (control) control.showY = !control.showY;
                break;

            case 90: // Z
                if (control) control.showZ = !control.showZ;
                break;

            case 32: // Spacebar
                if (control) control.enabled = !control.enabled;
                break;
        }
    }

    onDeleteSelectedPart(event) {
        let _self = this,
            main = this.main,
            control = main.transformControls;
        if (confirm('Are you sure you want to delete this part(s)?')) {
            if (control && control.tempParent) {

                for (let i = 0; i < control.tempParent.children.length; i++) {
                    let child = control.tempParent.children[i];
                    if (child._control) {
                        child._control.remove();
                    } else {
                        control.tempParent.remove(child);
                    }
                    i--;
                }
                control.detach();
                control.parent.remove(control);
                control.tempParent.parent.remove(control.tempParent);
                control.tempParent = null;
                return this.Utils.Config.onEventPrevent(event, true);
            }
        }
    }

    onDeletePart(mesh) {
        let _self = this,
            main = this.main,
            control = main.transformControls;
        if (confirm('Are you sure you want to delete part?')) {
            this._onDeletePart(mesh);
        }
    }

    _onDeletePart(mesh,isHistory) {
        this.onSelectPart();
        mesh._control.remove(isHistory);
    }

    onSelectPart(object) {
        let shouldKeepleftitems = false,
            transformControls = this.main.transformControls;
        if (object && transformControls.tempParent) {
            for (let i = 0; i < transformControls.tempParent.children.length; i++) {
                let child = transformControls.tempParent.children[i];
                if (child.uuid == object.uuid) {
                    this.deselectFromControls(object);
                    object = null;
                    shouldKeepleftitems = true;
                    let items = transformControls.tempParent.children.map((el) => el);
                    if (items.length > 1) {
                        this.onTransformModel();
                        return items.forEach((_child) => {
                            if (_child.isIntersectable) {
                                this.onTransformModel(_child);
                            }

                        })
                    }
                    break;
                }
            }
        }

        this.onTransformModel(object);
    }

    onWindowResize(width, height) {
        let app = this.main,
            _w = width || app._W(),
            _h = height || app._H(),
            _pxRatio = app.gl.getPixelRatio(),
            _px = 'px';

        //if (this.isFullScreen) {
        //    _w = window.innerWidth;
        //    _h = window.innerHeight;
        //    if(!this.lastHeight)this.lastHeight = app._H();
        //}else if(this.lastHeight){
        //    _h =this.lastHeight;
        //    this.lastHeight = null;
        //}
        app.camera.aspect = _w / _h;
        app.camera.updateProjectionMatrix();
        app.gl.setSize(_w, _h);
        // app.gl.domElement.style.width = _w + 'px';
        // app.gl.domElement.style.height = _h + 'px';
        if (app._decor) app._decor.onWindowResize();
        //app._container.style.height = _h + _px;
        if (app) app.refresh();
        if (app.composer) {
            app.composer.setSize(_w, _h);
            app.effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        }

        //if (app.rs_camera)app.rs_camera.helper.Update_RS_Camera(_w, _h, app.camera, app.controls);
    }

    /**
     * save image on computer
     * */
    onScreenShot() {
        let link = document.createElement("a");
        link.setAttribute("href", this.main.getRenderImage());
        link.setAttribute("download", "test.png");
        link.click();
    }


    deselectFromControls(child) {
        // child.parent.updateMatrixWorld();
        // child._orParent.updateMatrixWorld();
        // child.updateMatrixWorld();
        // child.material = child._material;
        // THREE.SceneUtils.detach(child, child.parent, child._orParent);
        child._control.toggleSelect(false, child.parent, child._orParent)
    }

    onTransformModel(object, shouldKeepleftitems, _parent) {
        let main = this.main,
            transformControls = main.transformControls,
            listOfmodels = [],
            parent = _parent;
        transformControls.detach();
        this.main.scene.remove(transformControls);
        // if (transformControls.lastSelected && transformControls.lastSelected._box) {
        //     transformControls.lastSelected._box.parent.remove(transformControls.lastSelected._box);
        // }

        this.main.datGui.model = object ? object._control : false;
        transformControls.lastSelected = object;
        if (transformControls.tempParent) {
            transformControls.tempParent.updateMatrixWorld();
            this.main.temp_model.updateMatrixWorld();
            for (let i = 0, list = transformControls.tempParent.children; i < list.length; i++) {
                let child = list[i];
                if (child.isIntersectable) {

                    listOfmodels.push(child);
                    this.deselectFromControls(child);
                    parent = child.parent;
                } else {
                    child.updateMatrixWorld();
                    THREE.SceneUtils.detach(child, child.parent, this.main.temp_model);
                }
                i--;
            }
            transformControls.tempParent.parent.remove(transformControls.tempParent);
            transformControls.tempStore.parent.remove(transformControls.tempStore);
            transformControls.tempParent = null;
            transformControls.tempStore = null;
        }
        if (!object) {
            return;
        }
        if (object) {
            listOfmodels.push(object);

            if (!object._orParent) {
                object._orParent = object.parent;
                object._material = object.material;
            }
        }


        let tempStore = new THREE.Object3D();
        if (!transformControls.tempParent) {
            transformControls.tempParent = new THREE.Object3D();
            transformControls.tempStore = new THREE.Object3D();
            transformControls.tempParent.isNew = true;
            transformControls.tempParent._category = GUtils.CATEGORIES.TEMP_TRANSFORM_CONTAINER;
            // object.parent.add(transformControls.tempParent);
            object.parent.add(transformControls.tempStore);
            transformControls.tempStore.add(transformControls.tempParent);
            transformControls.tempStore.add(transformControls);
            this.main.scene.add(transformControls.tempStore);
            // this.main.scene.add(transformControls);

        }

        listOfmodels.forEach((el) => {
            tempStore.add(el);
        });

        if (transformControls.tempParent._box) transformControls.tempParent._box.remove();
        transformControls.tempParent._box = new BoxControls({tempStore, viewer: this.main});


        let items = [
            ...listOfmodels,
            transformControls.tempParent._box.controls
        ];
        // transformControls.tempParent.position.copy(
        //     transformControls.tempParent._box.controls._center
        // );
        // transformControls.tempParent.add(new THREE.AxesHelper(100))


        transformControls.tempParent.updateMatrixWorld();

        if (tempStore.children.length > 1) {
            tempStore.children.forEach((mesh) => {
                if (mesh._helper) {
                    while (mesh._helper.children.length) {
                        mesh._helper.remove(mesh._helper.children[0]);
                    }
                    items.push((mesh._helper));
                    mesh._helper.visible = false;
                }
            })
        }

        items.forEach((el) => {
            if (el._control) {
                el._control.toggleSelect(true, tempStore, transformControls.tempParent);
            } else {
                el.updateMatrixWorld();
                el.material = main.model._selectedMaterial.clone();
                THREE.SceneUtils.attach(el, this.main.model, transformControls.tempParent);
            }

        });
        transformControls.attach(transformControls.tempParent);

        transformControls.traverse((ch) => {
            if (ch.type == "Mesh") transformControls.renderOrder = 1;
        });
    }

    onMouseUp(ev, acc) {
        this.main.toggleControls(true);
        this.main.controls.enabled = this.main.dragControls.enabled = true;
        document.body.style.cursor = '';
        if (this._lastSelectedMesh) {
            switch (this._lastSelectedMesh._category) {
                case 2: {
                    this._lastSelectedMesh._mouseup(ev);
                    break;
                }
            }
        }
        // this.Utils.Config.onEventPrevent(ev);
        this.mouse.down = this.lastSelectedMesh = this._lastSelectedMesh = null;
        this.canEdit = !this.canEdit;
        this.main.controls.enabled = true;
        this.main.refresh();

        if (this.mouse.hasMove) {
            return
        }
        if (this.keyCode.indexOf(16) > -1) {

        } else {


        }

        if (this.TOOL > 0) {
            this._pointerConductor.addPoint(this.lastInter, this.TOOL);
            return;//this.Utils.Config.onEventPrevent(ev, true);
        }
        if (this.main.controls.enabled) {
            this.onSelected(ev, (intersects) => {
                let object;
                if (intersects.length) {
                    object = (intersects[0]).object;
                    if (object._category != GUtils.CATEGORIES.STL_LOADED_PART) object = null;
                }
                this.onSelectPart(object);
            });
        }


    }

    onMouseMove(ev) {
        let noMouseDown = !this.mouse.down,
            _el = this._lastSelectedMesh,
            _elH = this.lastHovered;
        this.mouse.hasMove = !noMouseDown;

        this.lastSelectedMesh = this.lastHovered = null;
        this.main.refresh();
        document.body.style.cursor = '';
        this._pointerConductor.pointer.visible = false;
        if (noMouseDown) {
            if (_elH) {
                switch (_elH._category) {
                    case 2: {
                        _elH._mouseoout(ev);
                        break;
                    }
                }
            }

            this.onSelected(ev, (inters) => {
                // document.body.style.cursor = inters.length ? 'move' : '';
                if (inters && inters.length) {
                    document.body.style.cursor = 'move';
                    let _inter = inters[0],
                        element = this.lastHovered = _inter.object;

                    if (this.TOOL > 0) {


                        switch (element._category) {
                            case GUtils.CATEGORIES.STL_LOADED_PART: {
                                this._pointerConductor.pointer.rotateA(_inter);
                                break;
                            }
                        }
                        return this.Utils.Config.onEventPrevent(ev, true);
                    }


                    switch (element._category) {
                        case 2: {
                            element._mouseover(ev);
                            break;
                        }
                    }
                }

            });
        } else if (_el) {
            switch (_el._category) {
                case 2: {
                    _el._mousemove(ev);
                    this.main.scene.traverse((child) => {
                        if (child._control) {
                            child._control.updateLabel();
                        }
                    })
                    break;
                }
            }

        }

    }


    onMouseDown(ev) {
        this.mouse.hasMove = this.keyCode.indexOf(17) > -1;
        this.mouse.down = ev;
        this.main.controls.autoRotate = false;
        this.lastEv = this.lastSelectedMesh = false;


        if (this.lastInter) {

            let element = this.lastInter.object;


            if (this.TOOL > 0) {
                this.main.toggleControls(false);
                return this.Utils.Config.onEventPrevent(ev, true);
            }


            this._lastSelectedMesh = element;
            switch (element._category) {
                case 2: {
                    this.main.controls.enabled = this.main.dragControls.enabled = false;
                    this.Utils.Config.onEventPrevent(ev);
                    element._mousedown(ev);
                    break;
                }
            }
        }
    }

    isLogoSelected(uv, ar) {
        let decots = ar || this.main.decorations;
        for (let i = 0, decor = decots; i < decor.length; i++) {
            if (decor[i].isSelected(uv)) {
                return decor[i];
            }
        }
    }

    onSelected(ev, callback) {
        let intersectList = this.inter(ev);
        if (intersectList) {
            intersectList = intersectList.filter((el) => {
                return el.object.isIntersectable
            });
            // if (intersectList[0]) {
            //
            // }
        }
        this.lastInter = intersectList[0];
        callback(intersectList);
    }

    onMouseOut(ev) {
        // if (this.mouse.down) this.onMouseUp(ev);
    }

    /**
     * toggle fullscreen mode
     * */
    toggleFullscreen() {
        let _d = this.main.container;// this.main.gl.domElement.parentNode;
        if (_d.isFullScreen) {
            this.cancelFullscreen();
        } else {
            this.launchFullScreen(_d);
        }
        _d.isFullScreen = !_d.isFullScreen;
    }

    launchFullScreen(element) {
        if (element.requestFullScreen) {
            element.requestFullScreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullScreen) {
            element.webkitRequestFullScreen();
        }
    }

    cancelFullscreen() {
        let _d = document;
        if (_d.cancelFullScreen) {
            _d.cancelFullScreen();
        } else if (_d.mozCancelFullScreen) {
            _d.mozCancelFullScreen();
        } else if (_d.webkitCancelFullScreen) {
            _d.webkitCancelFullScreen();
        }
    }

    onfullscreenchange(e) {
        let _d = document;
        let fullscreenElement =
            _d.fullscreenElement ||
            _d.mozFullscreenElement ||
            _d.webkitFullscreenElement;
        let fullscreenEnabled =
            _d.fullscreenEnabled ||
            _d.mozFullscreenEnabled ||
            _d.webkitFullscreenEnabled;
        //console.log('fullscreenEnabled = ' + fullscreenEnabled, ',  fullscreenElement = ', fullscreenElement, ',  e = ', e);
        //this.isFullScreen = !this.isFullScreen;
        //this.onWindowResize();
    }

    onDbClick(e) {
        this.onSelected(e, (intersects) => {

            if (intersects.length) {
                let nTarget = intersects[0].point.clone(),
                    nPst = nTarget.clone().addScaledVector(intersects[0].face.normal, this.main.controls.minDistance * 1.2);
                nPst.fix = true;
                this.main.zoomCamera(null, nPst, nTarget);

            } else {
                this.main.zoomCamera();
            }

        });
        this.Utils.Config.onEventPrevent(e);
    }

    onCntxMenu(event) {
        this.onSelected(event, (intersects) => {


        });
        this.Utils.Config.onEventPrevent(event);
    }

    inter(ev, arg = null) {
        var _self = this,
            elements = arg && arg.childs ? arg.childs : _self.main.scene.children;

        if (!elements) return false;
        if (arg && arg.position) {
            var direction = new THREE.Vector3().subVectors(arg.target, arg.position);
            _self.raycaster.set(arg.position, direction.clone().normalize());
        } else {
            let
                mouseVector = _self.mouse.interPoint(ev);
            _self.raycaster.setFromCamera(mouseVector.webgl, _self.main.camera);
            this.lastMousePst = mouseVector.html;
        }

        return _self.raycaster.intersectObjects(elements, true);
    }

    onSelectTool(val) {
        this.TOOL = GUtils.TOOLS[val] || -1;
        this._pointerConductor.onSelectTool(this.TOOL);
        if (this.TOOL > -1) this.onSelectPart();
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

        //if (ev && ev.touches) {
        //    let firstFing = ev.touches.length ? ev.touches[0] : ev.changedTouches[0];
        //    _x = firstFing.clientX;
        //    _y = firstFing.clientY;
        //}

        return {
            webgl: new THREE.Vector2(((_x) / canvasW) * 2 - 1, -((_y) / canvasH) * 2 + 1),
            html: new THREE.Vector2(_x, _y)
        };
    }

    cumulativeOffset(element) {
        var top = 0, left = 0;
        do {
            top += element.offsetTop || 0;
            left += element.offsetLeft || 0;
            element = element.offsetParent;
        } while (element);

        return {
            offsetLeft: top,
            offsetTop: left
        };
    }
}

export class MAnimation {

    constructor(main) {
        this.lastUpdate = Date.now();
        this.number = Date.now();
        this.maxTimeUpdate = 3000;
        this.animations = [];
        this.lastIter = 0;
        this.app = main;
        this.play();
        setTimeout(() => {
            this.animate();
        }, 100);


    }

    add(callback) {
        this.animations.push(callback);
    }

    animate() {
        if (!this.app.gl.domElement.width || this.isStop) return;
        for (let i = 0; i < this.animations.length; i++) {
            this.animations[i]();
        }

        if (this.canAnimate) {
            this.canAnimate = this.lastUpdate > Date.now();
            if (!this.canAnimate || this.lastIter > 2) this.lastIter = 0;
            this.app.render();
        }
        requestAnimationFrame(() => {
            this.animate();
        });


    }

    play(flag) {
        this.lastUpdate = Date.now() + (this.maxTimeUpdate);
        if (this.canAnimate) return;
        this.canAnimate = !flag || !Pace.running;
    }

    stop() {
        this.isStop = true;
        this.canAnimate = false;
        this.lastIter = 0;
    }
}
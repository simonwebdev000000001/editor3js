import {GlViewer} from "./glViewer.js";
import {GLMain} from "./glMain.js";
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
        this.EVENTS_NAME = this.Utils.Config.EVENTS_NAME;
        this.mouse = new MMouse(main);
        this.raycaster = new THREE.Raycaster();
        this.pathOnMove = 50;
        this.keyCode = [];
        let _self = this,
            elem = main.gl.domElement,
            handler = (elem.addEventListener || elem.attachEvent).bind(elem),
            fullscreenEl = document.createElement('span');
        fullscreenEl.className = "glyphicon glyphicon-fullscreen fullscreen";
        fullscreenEl.addEventListener(this.EVENTS_NAME.CLICK, (e)=> {
            this.toggleFullscreen();
        });
        // main.container.appendChild(fullscreenEl);
        if (main.isMobile) {
            handler(this.EVENTS_NAME.TOUCH_START, (e)=>this.onMouseDown(e));
            handler(this.EVENTS_NAME.TOUCH_END, (e)=>this.onMouseUp(e));
            handler(this.EVENTS_NAME.TOUCH_MOVE, (e)=>this.onMouseMove(e));
        } else {
            handler(this.EVENTS_NAME.MOUSE_DOWN, (e)=>this.onMouseDown(e));
            handler(this.EVENTS_NAME.MOUSE_UP, (e)=>this.onMouseUp(e));
            handler(this.EVENTS_NAME.MOUSE_MOVE, (e)=>this.onMouseMove(e));
            handler(this.EVENTS_NAME.MOUSE_OUT, (e)=>this.onMouseOut(e));
        }


        handler(this.EVENTS_NAME.DB_CLICK, (e)=>this.onDbClick(e));
        handler(this.EVENTS_NAME.SELECT_START, this.Utils.Config.onEventPrevent);
        handler(this.EVENTS_NAME.DRAG.DROP, (e)=>this.onDrop(e));
        handler(this.EVENTS_NAME.DRAG.OVER, this.Utils.Config.onEventPrevent);
        handler(this.EVENTS_NAME.FULLSCREEN.WEB_KIT, (e)=> this.onfullscreenchange(e));
        handler(this.EVENTS_NAME.FULLSCREEN.MOZ, (e)=> this.onfullscreenchange(e));
        handler(this.EVENTS_NAME.FULLSCREEN.DEF, (e)=> this.onfullscreenchange(e));
        handler(this.EVENTS_NAME.CNTXMENU, (e)=> this.onCntxMenu(e));


        this.events_storage = [
            {elem: window, eventName: this.EVENTS_NAME.RESIZE, callback: ()=>this.onWindowResize()},
            {
                elem: window, eventName: this.EVENTS_NAME.KEY.DOWN, callback: function (event) {

                _self.keyCode.push(event.keyCode);
                switch (event.keyCode) {
                    case 27:
                    {
                        if (main.transformControls.object) {
                            let transformControls = main.transformControls;
                            transformControls.detach();
                            main.scene.remove(transformControls);
                        }
                        break;
                    } // ESC

                    case 81: // Q
                        if (main.transformControls) {
                            //main.transformControls.setMode(main.transformControls.space =='world'?"local":"world");
                        }
                        break;

                    case 16: // SHIFT
                        main.controls.enabled = false;

                    case 17: // Ctrl

                        break;

                    case 87: // W
                        if (main.transformControls)main.transformControls.setMode("translate");
                        break;

                    case 69: // E
                        if (main.transformControls)main.transformControls.setMode("rotate");
                        break;

                    case 82: // R
                        if (main.transformControls)main.transformControls.setMode("scale");
                        break;

                    case 187:
                    case 107: // +, =, num+
                        //if (main.transformControls)main.transformControls.setSize(main.transformControls.size + 0.1);
                        break;

                    case 189:
                    case 109: // -, _, num-
                        //if (main.transformControls)main.transformControls.setSize(Math.max(main.transformControls.size - 0.1, 0.1));
                        break;
                }

            }
            },
            {
                elem: window, eventName: this.EVENTS_NAME.KEY.UP, callback: function (event) {
                _self.keyCode = [];
                switch (event.keyCode) {

                    case 17: // Ctrl
                        //control.setTranslationSnap(1);
                        //control.setRotationSnap(1);
                        break;
                    case 16: // SHIFT
                        main.controls.enabled = true;
                        break; 
                    case 46: // Del
                        if(main._datGui)main._datGui.deleteSelected();
                        break;
                }
            }
            }
        ].filter(function (ev) {
            let handler = (ev.elem.addEventListener || ev.elem.attachEvent).bind(ev.elem);
            handler(ev.eventName, ev.callback);
            return true;
        });
        this.addScreenShotButton();
        this.addExportBtn();
        this.onWindowResize();
    }

    addScreenShotButton() {
        //<button type="button" class="render render-btn r-hidden" data-action="render_save">S</button>
        let btn = document.createElement('button');
        btn.className = 'btn border-slate text-slate-800 btn-flat whiteback scren-shot-btn';
        btn.innerText = "ScreenShot";
        // this.main.container.appendChild(btn);
        btn.addEventListener('click', (e)=> {
            this.onScreenShot();
        });
    }

    addExportBtn() {

        let btn = document.createElement('button');
        btn.className = 'btn border-slate text-slate-800 btn-flat whiteback scren-shot-btn';
        btn.innerText = "Save Translate";
        btn.style.bottom = '140px';
        // this.main.container.appendChild(btn);
        btn.addEventListener('click', (e)=> {
            let
                models = this.main.model,
                res = [{
                    name: "**-main-**",
                    position: models.position.clone(),
                    rotation: models.rotation.clone(),
                    quaternion: models.quaternion.clone(),
                    scale: models.scale.clone()
                }];
            models.traverse((child)=> {
                if (child.type == "Mesh") {
                    res.push({
                        name: child.userData.originName,
                        position: child.position.clone(),
                        rotation: child.rotation.clone(),
                        quaternion: child.quaternion.clone(),
                        scale: child.scale.clone()
                    });
                }
            });
            let blobObject = new Blob([JSON.stringify(res)]),
                url = window.URL.createObjectURL(blobObject),
                a = document.createElement("a");
            a.href = url;
            a.download = 'poly9_parts_transorm.json';
            a.click();
            window.URL.revokeObjectURL(url);
        });
    }

    onDestroy() {
        while (this.events_storage.length) {
            let ev = this.events_storage.shift();
            let handler = (ev.elem.removeEventListener || ev.elem.dispatchevent).bind(ev.elem);
            handler(ev.eventName, ev.callback);
        }
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
        if (app._decor)app._decor.onWindowResize();
        //app._container.style.height = _h + _px;
        if (app)app.refresh();
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
        link.setAttribute("download", "poly9.png");
        link.click();
    }

    onDrop(e) {
        this.Utils.Config.onEventPrevent(e);
        if (!this.curDrag || !this.curDrag.pattern)throw Error('nothing drag was selected');
        let opt = this.curDrag,
            data = opt.pattern;

        this.onSelected(e, (intersects)=> {
            if (intersects.length) {

            }
        });
    }

    onMouseUp(ev, acc) {
        this.Utils.Config.onEventPrevent(ev);
        this.mouse.down = this.lastSelectedMesh = null;
        this.canEdit = !this.canEdit;
        this.main.controls.enabled = true;
        this.main.refresh();

        if (!this.mouse.hasMove)this.onTransformModel();
        if (this.main.controls.enabled) {
            this.onSelected(ev, (intersects)=> {

                if (intersects.length && this.main.isAdmin) {
                    let _obj = (intersects[0]);
                    if (_obj.object.MODE == 1) {
                        this.onTransformModel(_obj.object);
                    } else if (_obj.object.MODE == 2) {
                        this.onTransformModel(_obj.object.light);
                    }
                }

            });
        }
    }

    onTransformModel(object) {
        let transformControls = this.main.transformControls;
        transformControls.detach();
        this.main.scene.remove(transformControls);
        if (!object)return;
        transformControls.attach(object);
        this.main.scene.add(transformControls);
        transformControls.traverse((ch)=> {
            if (ch.type == "Mesh")transformControls.renderOrder = 1;
        })
    }

    onMouseMove(ev) {
        this.mouse.hasMove = !!this.mouse.down;
        this.lastSelectedMesh = null;
        this.main.refresh();
        if (!this.main.controls.enabled) {
            // this.onSelected(ev, (inters)=> {
            //
            // });
        }
    }

    onSelected(ev, callback) {
        let intersectList = this.inter(ev);
        if (intersectList && intersectList[0]) {
            this.lastInter = intersectList[0];
        }
        callback(intersectList);
    }

    onMouseDown(ev) {
        this.mouse.hasMove = this.keyCode.indexOf(17) > -1;
        this.mouse.down = ev;
        this.main.controls.autoRotate = false;
        this.lastEv = this.lastSelectedMesh = false;
        if (this.main.controls.enabled) {
            // this.onSelected(ev, (inters)=> {
            //
            // });
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

    onMouseOut(ev) {
        if (this.mouse.down)this.onMouseUp(ev);
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
        this.onSelected(e, (intersects)=> {

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
        this.onSelected(event, (intersects)=> {

            if (intersects.length) {
                this.main._cntxMenu.toggle(intersects[0], this.lastMousePst);
            }

        });
        this.Utils.Config.onEventPrevent(event);
    }

    inter(ev, arg = null) {
        var _self = this,
            elements = arg && arg.childs ? arg.childs : [_self.main.model];

        if (!elements)return false;
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
            webgl: new THREE.Vector2(( (_x ) / canvasW) * 2 - 1, -( (_y ) / canvasH) * 2 + 1),
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
        setTimeout(()=> {
            this.animate();
        }, 100);


    }

    add(callback) {
        this.animations.push(callback);
    }

    animate() {
        if (!this.app.gl.domElement.width || this.isStop)return;
        for (let i = 0; i < this.animations.length; i++) {
            this.animations[i]();
        }

        if (this.canAnimate) {
            this.canAnimate = this.lastUpdate > Date.now();
            if (!this.canAnimate || this.lastIter > 2)this.lastIter = 0;
            this.app.render();
        }
        requestAnimationFrame(() => {
            this.animate();
        });


    }

    play(flag) {
        this.lastUpdate = Date.now() + ( this.maxTimeUpdate);
        if (this.canAnimate) return;
        this.canAnimate = !flag || !Pace.running;
    }

    stop() {
        this.isStop = true;
        this.canAnimate = false;
        this.lastIter = 0;
    }
}
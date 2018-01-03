import {GLMain} from '../viewer/glMain.js';
import {Config} from '../helpers/Config.js';

/*
 * MyGui - ui controls (on top right drop-down menu by default)
 * */
export class MyGui extends GLMain {

    constructor(app) {
        super();
        let gui = this.gui = new dat.GUI({width: 350});
        this.items = 0
        document.querySelector('.dg.ac').style.zIndex = 9999;
        gui.close();
        this.params = {
            addLights: ()=> {
                let _l = this.updateLights(prompt("Add light: AmbientLight(1),HemisphereLight(2),SpotLight(3),DirectionalLight(4),PointLight(5)", 5));
                if (!_l)return alert("There is no such light!");
                this.app._events.onTransformModel(_l);
            },
            addShapes: ()=> {
                let _l = this.updateShapes(prompt("Add shape: Box(1)", 1));
                if (!_l)return alert("There is no such shape!")
                this.app._events.onTransformModel(_l);
            },
            deleteItem: (m)=> {
                this.onAnyWay();
            }
        };
        this.curMat = null;
        this.hasMaterialEd = false;
        this.custom = null;
        this.app = app;


        let lights = gui.lights = gui.addFolder('Lights');
        let shapes = gui.shapes = gui.addFolder('Shapes');

        shapes.close();
        lights.close();

        gui.add(this.params, 'addLights');
        gui.add(this.params, 'addShapes');

    }

    updateShapes(category) {
        let light = this.app.createShape(category);

        return this.addShape(light);
    }

    updateLights(category) {
        let light = this.app.createLight(category);
        if (!light) return

        return this.addlight(light);
    }

    addlight(light) {
        if (!light) return;
        let par = ['position_x_y_z', 'intensity', 'distance', 'decay', 'color', 'angle', 'penumbra', 'visible', 'skyColor', 'groundColor', 'castShadow'],
            name = light.type + this.items++,
            lightsF = light._gui = this.gui.lights.addFolder(name);
        lightsF._Parents = this.gui.lights;
        lightsF.folderName = name;


        par.forEach((f)=> {
            let _f = f.split("_");
            if (_f.length < 2 && (typeof light[f] == 'undefined'))return;
            if (_f.length > 1) {
                let _p = lightsF.addFolder(_f[0]);
                for (let i = 1; i < _f.length; i++) {
                    _p.add(light[_f[0]], _f[i]).listen().min(-1000).max(1000).onChange(()=> {
                        this.onAnyWay();
                    });
                }
            } else if (f.toLowerCase().match('color')) {
                light['def' + f] = "#" + light[f].getHexString();
                lightsF.addColor(light, 'def' + f).onChange(()=> {
                    light[f].setHex('0x' + light['def' + f].substr(1));
                    this.onAnyWay();
                });
            } else if (typeof light[f] == 'number') {
                lightsF.add(light, f).listen().min(0).max(100 * 100).onChange(()=> {
                    this.onAnyWay();
                });
            } else {
                lightsF.add(light, f).listen().onChange(()=> {
                    this.onAnyWay();
                })
            }
        });
        lightsF.add(this.params, 'deleteItem').onChange(()=> {
            this.deleteSelected(light);
        })
        return light;
    }

    addShape(light) {
        if (!light) return;
        let par = ['position_x_y_z', 'rotation_x_y_z', 'scale_x_y_z', 'recieveShadow'],
            name = light.type + this.items++,
            lightsF = light._gui = this.gui.shapes.addFolder(name);
        lightsF._Parents = this.gui.shapes;
        lightsF.folderName = name;
        par.forEach((f)=> {
            let _f = f.split("_");
            if (_f.length < 2 && (typeof light[f] == 'undefined'))return;
            if (_f.length > 1) {
                let _p = lightsF.addFolder(_f[0]);
                for (let i = 1; i < _f.length; i++) {
                    _p.add(light[_f[0]], _f[i]).listen().min(-1000).max(1000).onChange(()=> {
                        this.onAnyWay();
                    });
                }
            } else {
                lightsF.add(light, f).listen().onChange(()=> {
                    this.onAnyWay();
                })
            }
        });
        lightsF.add(this.params, 'deleteItem').onChange(()=> {
            this.deleteSelected(light);
        });
        return light;
    }

    deleteSelected(item) {

        let lastObj;
        if (item == undefined) {
            lastObj = this.app.transformControls.object;

        } else {
            lastObj = item;
        }
        if (!lastObj)return;
        this.app._events.onTransformModel();
        lastObj.parent.remove(lastObj);
        if(lastObj._helper) lastObj._helper.parent.remove(lastObj._helper);
        this.app.saveJSON();
        if (lastObj._gui) {
            let _pr = lastObj._gui._Parents;
            _pr.close();
            lastObj._gui.domElement.parentNode.removeChild(lastObj._gui.domElement);
        }
        this.app.saveJSON();
    }

    onChange() {
        if (!this.curMat)return;
        for (let fied in this.params) {
            if (fied == 'color') {
                this.curMat[fied].setHex(this.params[fied]);
            } else if (fied == 'maps') {

            } else {
                this.curMat[fied] = this.params[fied] + 0.0;
            }
        }
        this.curMat.needsUpdate = true;
        this.onAnyWay();
    }

    onAnyWay() {
        this.app.refresh();
    }

    destroy() {
        this.gui.destroy();
    }
}
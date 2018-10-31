import GUtils from '../../utils'

export default class BoxControls {
    constructor({ tempStore, viewer }) {
        this.controls = new THREE.BoxHelper(tempStore, '#768492');
        this.controls._tempStore = tempStore;
        this.viewer = viewer;
        this._addBoxLines();
    }

    _addBoxLines() {
        let dimensionLines = [
            {
                color: 0x0000ff,
                dimension: 'x',
                vectorRotation: new THREE.Vector3(1, 0, 0),
                indexes: [
                    0, 1, 2, 3, 4, 5, 6, 7
                ]
            },
            {
                color: 0xff0000,
                dimension: 'y',
                vectorRotation: new THREE.Vector3(0, 1, 0),
                indexes: [
                    1, 2, 3, 0, 5, 6, 7, 4
                ]
            },
            {
                color: 0x00ff00,
                dimension: 'z',
                vectorRotation: new THREE.Vector3(0, 0, 1),
                indexes: [
                    0, 4, 1, 5, 2, 6, 3, 7
                ]
            }
        ];

        let geoVertices = this.controls.geometry.attributes.position.array,
            vertices = [];

        for (let i = 0; i < geoVertices.length; i += 3) {
            vertices.push(
                new THREE.Vector3(geoVertices[i], geoVertices[i + 1], geoVertices[i + 2])
            );
        }
        for (let i = 0; i < dimensionLines.length; i++) {
            let dimension = dimensionLines[i];


            let material = new THREE.LineBasicMaterial({
                color: GUtils.COLORS.EDGE
            }),
                controls = new THREE.Object3D();
            controls._dimension = dimension;
            for (let j = 0; j < dimension.indexes.length; j += 2) {
                let geometry = new THREE.Geometry();
                geometry.vertices.push(
                    vertices[dimension.indexes[j]],
                    vertices[dimension.indexes[j + 1]]
                );
                let line = (new BoxEdge({ geometry, material, parent: this })).edge;
                line._category = 2;
                line.isIntersectable = true;
                controls.add(line);
            }

            this.controls.add(controls);
        }
    }

    remove() {
        this.controls.parent.remove(this.controls);
    }
}

export class BoxEdge {
    constructor({ geometry, material, parent }) {
        let edge = this.edge = new THREE.Line(geometry, material),
            highLightMat = new THREE.LineBasicMaterial({ color: '#ff0000' });

        edge._mousemove = function (ev) {
            let _parent = this.parent._dimension,
                vectorRotation = _parent.vectorRotation,
                lastEv = this.lastEv ? this.lastEv : parent.viewer._events.mouse.down,
                distX = Math.abs(ev.clientX - lastEv.clientX),
                distY = Math.abs(ev.clientY - lastEv.clientY),
                _b = Math.max(distX, distY),
                _dir = ((_b == distX ? ev.clientX < lastEv.clientX : ev.clientY < lastEv.clientY) ? -1 : 1);
            if (_b < 5) return;
            let quaternion = new THREE.Quaternion();
            if (_parent.dimension != 'y') _dir *= -1;
            quaternion.setFromAxisAngle(vectorRotation, THREE.Math.degToRad(
                GUtils.CONTROLS.INCREMENTS.ROTATE
            ) * _dir);
            // parent.controls.parent.rotation[_parent.dimension] += 0.1 * _dir;
            // console.log(parent.controls.rotation)
            // parent.controls.parent.quaternion.slerp(quaternion, 1);
            parent.controls.parent.quaternion.multiply(quaternion);
            this.lastEv = ev;
        }
        edge._mousedown = function (ev) {
            ev.target.style.cursor = 'col-resize';

            parent.viewer.controls._enabled = parent.viewer.controls.enabled;
            parent.viewer.transformControls._enabled = parent.viewer.transformControls.enabled;
            parent.viewer.controls.enabled = parent.viewer.transformControls.enabled = false; 
            edge.material = highLightMat;
        }
        edge._mouseup = function (ev) {
            ev.target.style.cursor = '';
            this.lastEv = null;
            edge.material = material;
            parent.viewer.controls.enabled = parent.viewer.controls._enabled;
            parent.viewer.transformControls.enabled = parent.viewer.transformControls._enabled;
        }
        edge._mouseover = function (ev) {
            edge.material = highLightMat;
        }
        edge._mouseoout = function (ev) {
            edge.material = material;
        }

    }

}
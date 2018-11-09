import GUtils from '../../utils'

export default class BoxControls {
    constructor({ tempStore, viewer }) {
        this.controls = new THREE.BoxHelper(tempStore, GUtils.COLORS.GRAY);
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
                color: GUtils.COLORS.EDGE,
                linewidth: 3,
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
            highLightMat = new THREE.LineBasicMaterial({ color: '#ff0000', linewidth: 3 }),
            self = this;
        this.controls = parent;

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
            self.updateRotateLabel();

        }
        edge._mousedown = function (ev) {
            ev.target.style.cursor = 'col-resize';

            parent.viewer.controls._enabled = parent.viewer.controls.enabled;
            parent.viewer.transformControls._enabled = parent.viewer.transformControls.enabled;
            parent.viewer.controls.enabled = parent.viewer.transformControls.enabled = false;
            // edge.material = highLightMat;
            edge.material.color = edge.material._color;
            self.initRotateLabel();
        }
        edge._mouseup = function (ev) {
            ev.target.style.cursor = '';
            this.lastEv = null;
            // edge.material = material;
            parent.viewer.controls.enabled = parent.viewer.controls._enabled;
            parent.viewer.transformControls.enabled = parent.viewer.transformControls._enabled;
            edge.material.color = edge.material.defcolor;
            self.removeLabels();
        }
        edge._mouseover = function (ev) {
            if (!edge.material._color) {
                edge.material._color = new THREE.Color(GUtils.COLORS.RED);
                edge.material.defcolor = edge.material.color;
            }
            edge.material.color = edge.material._color;

        }
        edge._mouseoout = function (ev) {
            edge.material.color = edge.material.defcolor;
        }

    }

    removeLabels() {
        this.edge._tempLabelStore.parent.remove(this.edge._tempLabelStore);
        this.edge._tempLabelStore.labelAngleContainer._delete();
    }
    initRotateLabel() {
        let { parent } = this.edge,
            helper = new THREE.BoxHelper(parent),
            { _dimension } = parent,
            tempLabelStore = this.edge._tempLabelStore = new THREE.Object3D(),
            { radius } = helper.geometry.boundingSphere,
            geometry = this._updateRingGeo({ radius }),
            material = new THREE.MeshBasicMaterial({ color: GUtils.COLORS.RED, side: THREE.DoubleSide }),
            mesh = this.edge._tempLabelStore.ringElement = new THREE.Mesh(geometry, material);

        tempLabelStore.position.copy(helper.geometry.boundingSphere.center);
        tempLabelStore.quaternion.slerp(this.controls.viewer.transformControls.tempParent.quaternion, 1);
        switch (_dimension.dimension) {
            case 'x': {
                let quaternion = new THREE.Quaternion();
                quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
                tempLabelStore.quaternion.slerp(quaternion, 1);
                break;
            }
            case 'y': {
                let quaternion = new THREE.Quaternion();
                quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
                tempLabelStore.quaternion.slerp(quaternion, 1);
                break;
            }
        }
        tempLabelStore.add(mesh);
        this.controls.viewer.scene.add(tempLabelStore);

        let div = tempLabelStore.labelAngleContainer = document.createElement('div');
        div.className = 'label-container';
        div.style.backgroundColor = GUtils.COLORS.RED;
        div.style.color = 'white';
        this.controls.viewer.labelContainer.appendChild(div);

        let angle = 0,
            tempPivot = new THREE.Mesh(
                new THREE.SphereBufferGeometry(10, 1, 1)
            ),
            _attr = mesh.geometry.attributes.position.array,
            vec = new THREE.Vector3(
                _attr[0],
                _attr[1],
                _attr[2]
            );
        tempPivot.position.copy(vec);
        tempLabelStore.add(tempPivot);

        this.controls.viewer.model.updateMatrixWorld();
        tempLabelStore.updateMatrixWorld();
        tempPivot.updateMatrixWorld();
        THREE.SceneUtils.detach(tempPivot, this.controls.viewer.model, tempLabelStore);
        tempPivot.visible = false;
        let pst = this.controls.viewer.toScreenPosition(tempPivot);


        div.style.left = `${pst.x}px`;
        div.style.top = `${pst.y}px`;
    }
    updateRotateLabel() {
        // this.controls 
        let { parent, _tempLabelStore } = this.edge,
            { labelAngleContainer, ringElement } = _tempLabelStore,
            angleRad = this.controls.viewer.transformControls.tempParent.rotation[parent._dimension.dimension],
            angleDeg = THREE.Math.radToDeg(
                angleRad
            ),
            angleDegText = angleDeg.toFixed(GUtils.SETTINGS.ROUND);
        ringElement.geometry = this._updateRingGeo({ thetaLength: angleRad / Math.PI * 2 });
        labelAngleContainer.innerHTML = `<span>${angleDegText}&deg;</span>`;
    }
    _updateRingGeo({ radius, thetaLength = 0 }) {
        let _rad = radius || this.lastRadius;
        if (_rad) {
            this.lastRadius = _rad;
        }
        return new THREE.RingBufferGeometry(_rad, _rad + 5, 126, 1, 0, thetaLength)
    }

}

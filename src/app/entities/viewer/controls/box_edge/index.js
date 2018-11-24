import GUtils from "../../../utils";
import GLControls from "../index";

export default class BoxEdge extends GLControls{
    constructor({geometry, material, parent, name}) {
        super(parent.viewer.camera);
        let edge = this.edge = new THREE.Line(geometry, material),
            highLightMat = new THREE.LineBasicMaterial({color: '#ff0000', linewidth: 3}),
            self = this;
        this.controls = parent;


        edge.name = name;
        edge._category = 2;
        edge.isIntersectable = true;
        edge._mousemove = function (ev) {
            // let _parent = this.parent._dimension,
            //     vectorRotation = _parent.vectorRotation,
            //     lastEv = this.lastEv ? this.lastEv : parent.viewer._events.mouse.down,
            //     distX = Math.abs(ev.clientX - lastEv.clientX),
            //     distY = Math.abs(ev.clientY - lastEv.clientY),
            //     _b = Math.max(distX, distY),
            //     _dir = ((_b == distX ? ev.clientX < lastEv.clientX : ev.clientY < lastEv.clientY) ? -1 : 1);
            // if (_b < 5) return;
            // let quaternion = new THREE.Quaternion();
            // if (_parent.dimension != 'y') _dir *= -1;
            // quaternion.setFromAxisAngle(vectorRotation, THREE.Math.degToRad(
            //     GUtils.CONTROLS.INCREMENTS.ROTATE
            // ) * _dir);
            // // parent.controls.parent.rotation[_parent.dimension] += 0.1 * _dir;
            // // console.log(parent.controls.rotation)
            // // parent.controls.parent.quaternion.slerp(quaternion, 1);
            // parent.controls.parent.quaternion.multiply(quaternion);
            // this.lastEv = ev;

            // self.updateMtrix();
            self.pointerMove(self.getPointer(ev));
            self.updateRotateLabel();

        }
        edge._mousedown = function (ev) {
            ev.target.style.cursor = 'col-resize';


            // edge.material = highLightMat;
            edge.material.color = edge.material._color;

            self.updateMtrix();
            self.pointerDown(self.getPointer(ev));
            self.initRotateLabel();
        }
        edge._mouseup = function (ev) {
            ev.target.style.cursor = '';
            this.lastEv = null;
            // edge.material = material;

            edge.material.color = edge.material.defcolor;
            self.removeLabels();
            self.pointerUp();
        }
        edge._mouseover = function (ev) {
            if (!edge.material._color) {
                edge.material._color = new THREE.Color(GUtils.COLORS.RED);
                edge.material.defcolor = edge.material.color;
            }
            edge.material.color = edge.material._color;
            self.pointerHover(this);

        }
        edge._mouseoout = function (ev) {
            edge.material.color = edge.material.defcolor;
            self.pointerHover();
        }
    }

    rotateObject() {
        return this.controls.controls.parent
        // return this.controls.viewer.transformControls.object
    }

    editObject(){
        return this.rotateObject();
    }


    pointerMove(pointer) {
        let {
                axis,
                ray,
                _plane,
                pointStart,
                pointEnd,
                rotationAxis,
                _alignVector,
                _tempVector,
                worldPositionStart,
                worldQuaternionStart,
                eye,
                _quaternionStart,
                _tempQuaternion,
                worldPosition,
                worldQuaternion,
                worldScale,
                parentScale,
                parentQuaternion
            } = this,
            object = this.rotateObject();


        ray.setFromCamera(pointer, this.camera);

        var planeIntersect = ray.intersectObjects([_plane], true)[0] || false;

        if (planeIntersect === false) return;

        pointEnd.copy(planeIntersect.point).sub(worldPositionStart);

        pointEnd.applyQuaternion(worldQuaternionStart.clone().inverse());


        var unit = this._unit[axis];
        var quaternion = worldQuaternion;
        var ROTATION_SPEED = 0.013257744023014797;//10 / worldPosition.distanceTo(_tempVector.setFromMatrixPosition(this.camera.matrixWorld));

        if (axis === 'X' || axis === 'Y' || axis === 'Z') {
            _alignVector.copy(unit).applyQuaternion(quaternion);

            rotationAxis.copy(unit);

            this._tempVector = unit.clone();
            let _tempVector2 = pointEnd.clone().sub(pointStart);


            this._tempVector.applyQuaternion(quaternion);
            _tempVector2.applyQuaternion(worldQuaternionStart);


            let rotationAngle = _tempVector2.dot(_tempVector.cross(eye).normalize()) * ROTATION_SPEED;
            if (GUtils.CONTROLS.INCREMENTS.ROTATE) {
                let snap = THREE.Math.degToRad(GUtils.CONTROLS.INCREMENTS.ROTATE);
                rotationAngle = Math.round(rotationAngle / snap) * snap;
            }
            // Apply rotate
            this.rotationAngle = rotationAngle;
            if (this.space === 'local') {

                object.quaternion.copy(_quaternionStart);
                object.quaternion.multiply(_tempQuaternion.setFromAxisAngle(rotationAxis, rotationAngle));

            } else {

                object.quaternion.copy(_tempQuaternion.setFromAxisAngle(rotationAxis, rotationAngle));
                object.quaternion.multiply(_quaternionStart);

            }

            this.controls.updateArrowPst();
        }
    }

    removeLabels() {
        this.edge._tempLabelStore.parent.remove(this.edge._tempLabelStore);
        this.edge._tempLabelStore.labelAngleContainer._delete();
        this.edge._tempLabelStore = null;
    }

    initRotateLabel() {
        let {parent} = this.edge,
            // helper = new THREE.BoxHelper(parent),
            {_dimension} = parent,
            tempLabelStore = this.edge._tempLabelStore = new THREE.Object3D(),
            transformObject = this.rotateObject(),
            radius = transformObject.children[0].geometry.boundingSphere.radius,//helper.geometry.boundingSphere,
            geometry = this._updateRingGeo({radius, dimension: parent._dimension.dimension}),
            material = new THREE.MeshBasicMaterial({color: GUtils.COLORS.RED, side: THREE.DoubleSide}),
            mesh = this.edge._tempLabelStore.ringElement = new THREE.Mesh(geometry, material);
        // tempLabelStore.position.copy(helper.geometry.boundingSphere.center);
        // tempLabelStore.quaternion.slerp(transformObject.quaternion, 1);
        // tempLabelStore.position.copy(transformObject.position);


        // transformObject.updateMatrix();
        // transformObject.updateMatrixWorld();

        // transformObject.matrix.decompose(tempLabelStore.position,tempLabelStore.quaternion,tempLabelStore.scale);
        tempLabelStore.quaternion.slerp(transformObject.quaternion, 1);
        // switch (_dimension.dimension) {
        //     case 'x': {
        //         // let quaternion = new THREE.Quaternion();
        //         tempLabelStore.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
        //         // tempLabelStore.quaternion.multiply(quaternion);
        //         break;
        //     }
        //     case 'y': {
        //         // let quaternion = new THREE.Quaternion();
        //         tempLabelStore.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
        //         // tempLabelStore.quaternion.multiply(quaternion);
        //         break;
        //     }
        // }
        // tempLabelStore.quaternion.multiply(transformObject.quaternion);

        tempLabelStore.position.copy(transformObject.position);
        tempLabelStore.add(mesh);
        // transformObject.add(tempLabelStore);
        transformObject.parent.add(tempLabelStore);
        // this.controls.viewer.scene.add(tempLabelStore);

        let div = tempLabelStore.labelAngleContainer = document.createElement('div');
        div.className = 'label-container label-transform';
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
        let {parent, _tempLabelStore} = this.edge,
            {labelAngleContainer, ringElement} = _tempLabelStore,
            transformObject = this.rotateObject(),
            angleRad = transformObject.rotation[parent._dimension.dimension],
            angleDeg = THREE.Math.radToDeg(
                angleRad
            ),
            angleDegText = angleDeg.toFixed(GUtils.SETTINGS.ROUND);

        if (parent._dimension.dimension == 'y') angleRad *= -1;
        ringElement.geometry = this._updateRingGeo({
            thetaLength: angleRad / Math.PI * 2,
            dimension: parent._dimension.dimension
        });
        labelAngleContainer.innerHTML = `<span>${angleDegText}&deg;</span>`;
    }

    _updateRingGeo({radius, thetaLength = 0, dimension}) {
        let _rad = radius || this.lastRadius;
        if (_rad) {
            this.lastRadius = _rad;
        }
        let geo = new THREE.RingBufferGeometry(_rad, _rad + 5, 126, 1, 0, thetaLength);
        if (dimension == 'x') {
            geo.rotateY(Math.PI / 2);
        } else if (dimension == 'y') {
            geo.rotateX(Math.PI / 2);
        }
        return geo
    }

}

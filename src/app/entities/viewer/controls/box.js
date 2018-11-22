import GUtils from '../../utils'

export default class BoxControls {
    constructor({tempStore, viewer}) {
        let countOfItems = tempStore.children.length;
        if (countOfItems > 1||1) {
            this.controls = new THREE.BoxHelper(tempStore, GUtils.COLORS.GRAY);
            this.controls.geometry.computeBoundingBox();
        } else {
            let mesh = tempStore.children[0];
            this.controls = mesh._helper;
            while (this.controls.children.length) this.controls.remove(this.controls.children[0]);
            mesh.updateMatrix();
            // this.controls.geometry.translate(mesh.position.x,mesh.position.y,mesh.position.z);
            this.controls.geometry.computeBoundingSphere();
            // this.controls.quaternion.copy(mesh.quaternion);
            // mesh.matrix.decompose(this.controls.position, this.controls.quaternion, this.controls.scale);
            mesh.matrix.identity();
            mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
        }

        // this.controls.parent.radius = this.controls.geometry.boundingSphere.radius;
        this.controls._tempStore = tempStore;
        this.viewer = viewer;
        let v1 = this.controls.geometry.boundingBox.min,
            v2 = this.controls.geometry.boundingBox.max;
        viewer.transformControls.children[0].boundingBoxMesh = {
            _width: v1.distanceTo(new THREE.Vector3(v2.x, v1.y, v1.z)),
            _depth: v1.distanceTo(new THREE.Vector3(v1.x, v2.y, v1.z)),
            _height: v1.distanceTo(new THREE.Vector3(v1.x, v1.y, v2.z))
        }
        this._addBoxLines();
        this._addTranslatePivot();

        this.controls._center = this.controls.geometry.boundingSphere.center;
        // console.log(this.controls._center);
        // if (countOfItems == 1) {
        //     let mesh = tempStore.children[0];
        //     mesh.updateMatrix();
        //     // this.controls.position.copy(mesh.position);
        //     // this.controls.quaternion.copy(mesh.quaternion);
        //     // this.controls.position.copy(mesh.position);
        //     // this.controls.quaternion.copy(mesh.quaternion);
        //     // mesh.matrix.decompose(this.controls.position, this.controls.quaternion, this.controls.scale);
        //     // if (this.controls.position.distanceTo(this.viewer.scene.position) == 0) {
        //     //
        //     // } else {
        //     //     if(this.controls.last_center)this.controls._center = this.controls.last_center;
        //     // }
        //
        //     mesh.matrix.identity();
        //     mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
        //
        // }

        this.updateArrowPst();
    }

    _addTranslatePivot() {
        let mesh = this._translate_pivot = new THREE.Mesh(new THREE.SphereBufferGeometry(10, 1, 1));
        let meshCenter = this._center_pivot = new THREE.Mesh(new THREE.SphereBufferGeometry(10, 1, 1));
        mesh.visible = false;
        meshCenter.visible = false;
        // mesh.scale.multiplyScalar(10);
        // mesh.scale.multiplyScalar(10);
        mesh.position.copy(this.controls.geometry.boundingBox.min);
        meshCenter.position.copy(this.controls.geometry.boundingSphere.center);

        this.viewer.model.updateMatrixWorld();
        this.controls.updateMatrixWorld();
        mesh.updateMatrixWorld();
        THREE.SceneUtils.detach(mesh, this.viewer.model, this.controls);
        // THREE.SceneUtils.detach(meshCenter, this.viewer.model, this.controls);
        this.controls.add(meshCenter)
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
                let line = (new BoxEdge({
                    geometry,
                    material,
                    parent: this,
                    name: dimension.dimension.toUpperCase()
                })).edge;

                controls.add(line);
            }

            this.controls.add(controls);
        }
    }

    remove() {
        this.controls.parent.remove(this.controls);
    }

    onStartTranslate() {
        let tempLabelStore = this._tempLabelStore = new THREE.Object3D();
        let div = tempLabelStore.labelTranslateContainer = document.createElement('div');
        div.className = 'label-container label-transform';
        div.style.backgroundColor = GUtils.COLORS.RED;
        div.style.color = 'white';
        this.viewer.labelContainer.appendChild(div);
        this.viewer.scene.add(tempLabelStore);


        //add temp floor
        let {boundingBox} = this.controls.geometry;

        this._tempFloor = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(
                boundingBox.min.distanceTo(new THREE.Vector3(boundingBox.max.x, boundingBox.min.y, boundingBox.min.z)),
                boundingBox.min.distanceTo(new THREE.Vector3(boundingBox.min.x, boundingBox.max.y, boundingBox.min.z)),
                1
            ),
            new THREE.MeshPhongMaterial(
                {
                    color: GUtils.COLORS.SELECTED,
                    transparent: true,
                    opacity: 0.3
                }
            )
        );
        // this._tempFloor.rotation.x = -Math.PI / 2;
        this.viewer.scene.add(this._tempFloor);
        this._tempFloor.position.copy(this.viewer.transformControls.worldPositionStart);
        this._tempFloor.position.z -= (boundingBox.min.distanceTo(new THREE.Vector3(boundingBox.min.x, boundingBox.min.y, boundingBox.max.z))) / 2;

        //init All boxhelpers
        this.viewer.transformControls.tempParent.traverse((child) => {
            if (child.isIntersectable) {
                child._temp_boundingBox = new THREE.BoxHelper(child);
            }
        })
    }

    onEndTranslate() {
        this._tempLabelStore.parent.remove(this._tempLabelStore);
        this._tempLabelStore.labelTranslateContainer._delete();
        this._tempLabelStore = null;
        this.viewer.scene.traverse((child) => {
            if (child._category == GUtils.CATEGORIES.STL_LOADED_PART) {
                child._control.onCollisioin(false);
            }
        });
        this._tempFloor.parent.remove(this._tempFloor);
        this._tempFloor = null;
    }

    onChangeTranslate(pst1, pst2) {
        if (!this._tempLabelStore) return;

        pst1 = pst1.clone().add(this.viewer.transformControls.position);
        pst2 = pst2.clone().add(this.viewer.transformControls.position);
        this._tempLabelStore.position.copy(GUtils.getPointInBetweenByPerc(pst1, pst2));
        let pst = this.viewer.toScreenPosition(this._tempLabelStore);
        this._tempLabelStore.labelTranslateContainer.style.left = `${pst.x}px`;
        this._tempLabelStore.labelTranslateContainer.style.top = `${pst.y}px`;
        this._tempLabelStore.labelTranslateContainer.innerText = `${pst1.distanceTo(pst2).toFixed(GUtils.SETTINGS.ROUND)}${GUtils.DIMENSION.CURRENT.text}`;

        this.checkCollision();
    }

    checkCollision() {
        if (!this.viewer.transformControls.tempParent) return;
        let indexes = [], collisions = {};
        this.viewer.transformControls.tempParent.traverse((child) => {
            if (child._category == GUtils.CATEGORIES.STL_LOADED_PART) {

                child.parent.updateMatrixWorld();
                let vector = new THREE.Vector3(), isCollision = false;
                vector.setFromMatrixPosition(child.matrixWorld);
                let dist = child._temp_boundingBox.geometry.boundingSphere.radius;
                indexes.push(child.uuid);
                this.viewer.model.traverse((mesh) => {
                    if (mesh._category == GUtils.CATEGORIES.STL_LOADED_PART && indexes.indexOf(mesh.uuid) < 0) {
                        mesh.parent.updateMatrixWorld();
                        let _vector = new THREE.Vector3();
                        _vector.setFromMatrixPosition(mesh.matrixWorld);

                        let isInCollision = vector.distanceTo(_vector) < dist;
                        if (isInCollision) {
                            collisions[mesh.uuid] = true;
                            collisions[child.uuid] = true;
                        }
                        child._control.onCollisioin(collisions[child.uuid]);
                        mesh._control.onCollisioin(collisions[mesh.uuid]);
                    }
                })
            }
        })
    }

    updateArrowPst() {

        let {transformControls} = this.viewer,
            // center = transformControls.tempParent._box.controls.geometry.boundingSphere.center,
            centerPivot = new THREE.Vector3(),
            endPoint = new THREE.Vector3();
        // this._translate_pivot.parent.updateMatrixWorld();
        this._center_pivot.parent.updateMatrixWorld();
        endPoint.setFromMatrixPosition(this._translate_pivot.matrixWorld);
        centerPivot.setFromMatrixPosition(this._center_pivot.matrixWorld);

        let direction = endPoint.clone().sub(centerPivot).normalize(),
            dist = endPoint.distanceTo(centerPivot);

        transformControls.position.copy(this.viewer.scene.position).addScaledVector(direction, dist);
    }
}

export class BoxEdge {
    constructor({geometry, material, parent, name}) {
        let edge = this.edge = new THREE.Line(geometry, material),
            highLightMat = new THREE.LineBasicMaterial({color: '#ff0000', linewidth: 3}),
            self = this;
        this.camera = parent.viewer.camera;
        this.controls = parent;
        this._plane = new THREE.TransformControlsPlane();
        this.dragging = false;
        this.axis = null;
        this.mode = 'rotate';
        this.rotationSnap = 0;
        this.space = 'local';
        this.ray = new THREE.Raycaster();
        this.cameraPosition = new THREE.Vector3();
        this.cameraScale = new THREE.Vector3();
        this.eye = new THREE.Vector3();
        this.pointEnd = new THREE.Vector3();
        this.pointStart = new THREE.Vector3();
        this.rotationAxis = new THREE.Vector3();
        this._alignVector = new THREE.Vector3();
        this._tempVector = new THREE.Vector3();
        this.parentPosition = new THREE.Vector3();
        this.parentQuaternion = new THREE.Quaternion();
        this.parentScale = new THREE.Vector3();
        this.worldScaleStart = new THREE.Vector3();
        this.worldPositionStart = new THREE.Vector3();
        this.worldPosition = new THREE.Vector3();
        this.worldQuaternion = new THREE.Quaternion();
        this.worldQuaternionStart = new THREE.Quaternion();
        this._quaternionStart = new THREE.Quaternion();
        this.cameraQuaternion = new THREE.Quaternion();
        this._tempQuaternion = new THREE.Quaternion();
        this.worldScale = new THREE.Vector3();

        this._unit = {
            X: new THREE.Vector3(1, 0, 0),
            Y: new THREE.Vector3(0, 1, 0),
            Z: new THREE.Vector3(0, 0, 1)
        }

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

            self.updateMtrix();
            self.pointerMove(self.getPointer(ev));
            self.updateRotateLabel();

        }
        edge._mousedown = function (ev) {
            ev.target.style.cursor = 'col-resize';

            parent.viewer.controls._enabled = parent.viewer.controls.enabled;
            parent.viewer.transformControls._enabled = parent.viewer.transformControls.enabled;
            parent.viewer.controls.enabled = parent.viewer.transformControls.enabled = false;
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
            parent.viewer.controls.enabled = parent.viewer.controls._enabled;
            parent.viewer.transformControls.enabled = parent.viewer.transformControls._enabled;
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


    getPointer(event) {

        var pointer = event.changedTouches ? event.changedTouches[0] : event;

        var rect = this.controls.viewer.gl.domElement.getBoundingClientRect();

        return {
            x: (pointer.clientX - rect.left) / rect.width * 2 - 1,
            y: -(pointer.clientY - rect.top) / rect.height * 2 + 1,
            button: event.button
        };

    }

    updateMtrix() {
        let object = this.rotateObject(),
            {

                eye,
                cameraPosition,
                cameraQuaternion,
                cameraScale,
                parentPosition,
                worldPosition,
                worldQuaternion,
                worldScale,
                parentScale,
                parentQuaternion
            } = this;


        object.updateMatrixWorld();
        object.parent.matrixWorld.decompose(parentPosition, parentQuaternion, parentScale);
        object.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);


        this.camera.updateMatrixWorld();
        this.camera.matrixWorld.decompose(cameraPosition, cameraQuaternion, cameraScale);
        if (this.camera instanceof THREE.PerspectiveCamera) {

            eye.copy(cameraPosition).sub(worldPosition).normalize();

        }
    }

    pointerUp(pointer) {


        this.dragging = false;
        this.axis = null;

    };

    pointerHover = function (intersect) {
        this.axis = intersect ? intersect.name : null
    };

    pointerDown(pointer) {
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
            worldScaleStart,
            worldQuaternionStart,
            _quaternionStart,
            worldPosition,
            worldQuaternion,
            worldScale,
            parentScale,
            parentQuaternion
        } = this;
        let object = this.rotateObject();

        ray.setFromCamera(pointer, this.camera);

        let planeIntersect = ray.intersectObjects([_plane], true)[0] || false;

        if (planeIntersect) {

            var space = this.space;

            // if (space === 'local' && this.mode === 'rotate') {
            //
            //     var snap = this.rotationSnap;

            // if (this.axis === 'X' && snap) this.object.rotation.x = Math.round(this.object.rotation.x / snap) * snap;
            // if (this.axis === 'Y' && snap) this.object.rotation.y = Math.round(this.object.rotation.y / snap) * snap;
            // if (this.axis === 'Z' && snap) this.object.rotation.z = Math.round(this.object.rotation.z / snap) * snap;

            // }

            object.updateMatrixWorld();
            object.parent.updateMatrixWorld();

            // _positionStart.copy(object.position);
            _quaternionStart.copy(object.quaternion);
            // _scaleStart.copy(object.scale);

            object.matrixWorld.decompose(worldPositionStart, worldQuaternionStart, worldScaleStart);

            pointStart.copy(planeIntersect.point).sub(worldPositionStart);

            if (space === 'local') pointStart.applyQuaternion(worldQuaternionStart.clone().inverse());

        }

        this.dragging = true;

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

            let rotationAngle = this.rotationAngle = _tempVector2.dot(_tempVector.cross(eye).normalize()) * ROTATION_SPEED;

            // Apply rotate

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

        // let rotationAxis = new THREE.Vector3();
        // switch (parent._dimension.dimension) {
        //     case 'x': {
        //         rotationAxis = new THREE.Vector3(0, 0, 1);
        //         break
        //     }
        //     case 'y': {
        //         rotationAxis = new THREE.Vector3(0, 0, 1);
        //         break
        //     }
        //     case 'z': {
        //         rotationAxis = new THREE.Vector3(0, 0, 1);
        //         break
        //     }
        // }
        // let startQuaternion = new THREE.Quaternion();
        // if (!_tempLabelStore.startQuaternion) _tempLabelStore.startQuaternion = _tempLabelStore.quaternion.clone();
        // _tempLabelStore.quaternion.copy(_tempLabelStore.startQuaternion);
        // _tempLabelStore.quaternion.multiply(startQuaternion.setFromAxisAngle(rotationAxis, angleRad  ));
        // _tempLabelStore.quaternion.slerp(_tempLabelStore.quaternion,_tempLabelStore.quaternion.clone().dot(_tempLabelStore.parent.quaternion),_tempLabelStore.quaternion,1)
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

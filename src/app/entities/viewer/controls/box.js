import GUtils from '../../utils'
import BoxEdge from './box_edge'
import ScaleControls from "./scale_axis";

export default class BoxControls {
    constructor({tempStore, viewer}) {
        let countOfItems = tempStore.children.length;
        if (countOfItems > 1 ) {
            this.controls = new THREE.BoxHelper(tempStore, GUtils.COLORS.GRAY);
            this.controls._parent = this;
            this.controls.geometry.computeBoundingBox();
            this.controls._center = this.controls.geometry.boundingSphere.center;

            tempStore.children
        } else {
            let mesh = tempStore.children[0];
            this.controls = mesh._helper;
            mesh._helper.visible = true;
            while (this.controls.children.length) this.controls.remove(this.controls.children[0]);//remove all controls, line rotations, scaling

            // this.controls.matrix.identity();
            // this.controls.matrix.decompose(this.controls.position, this.controls.quaternion, this.controls.scale);
        }


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


        if (countOfItems > 1 || !this.controls.isOnePart) {
            this.controls.isOnePart = true;
            viewer.transformControls.tempParent.position.copy(
                this.controls.geometry.boundingSphere.center
            );
        }else if(this.controls.isOnePart ){
            let mesh = tempStore.children[0];
            // mesh.updateMatrix();
            // viewer.transformControls.tempParent.position.copy(mesh.position);
            // this.controls.position.copy(mesh.position);
            // this.controls.geometry.translate(mesh.position.x,mesh.position.y,mesh.position.z);
            // if (this.controls.isOnePart) {
            //     this.controls.geometry.computeBoundingSphere();
            // viewer.transformControls.tempParent.rotation.copy(mesh.rotation);
            // viewer.transformControls.tempParent.position.copy(mesh.position.clone().negate());
            mesh.matrix.decompose(viewer.transformControls.tempParent.position, viewer.transformControls.tempParent.quaternion, viewer.transformControls.tempParent.scale);
            // mesh.matrix.decompose(this.controls.position, this.controls.quaternion, this.controls.scale);

            // mesh.matrix.identity();
            // mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
            // }
        }
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
        //rotation controls
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

        //scaling controls
        let scalingControls = new ScaleControls({parent: this});
        this.controls.add(scalingControls.container);
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


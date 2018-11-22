import GUtils from "../../utils";

let copies = 0;
export default class ModelPart {

    constructor(viewer, {orGeometry, name}) {
        this.viewer = viewer;
        let parent = viewer.model,
            mesh = this.mesh = new THREE.Mesh(orGeometry, viewer.model._curMaterial.clone());
        mesh._helper = new THREE.BoxHelper(mesh, GUtils.COLORS.GRAY);
        mesh._helper.geometry.computeBoundingBox();
        mesh.isIntersectable = true;
        mesh._category = GUtils.CATEGORIES.STL_LOADED_PART;
        parent.add(mesh);
        mesh.name = name;

        mesh._control = this;
        if (viewer._ui) {
            viewer._ui.onLoadPart(mesh);
        }
        mesh._boxSize = function () {
            let _box = this._helper.geometry.boundingBox,
                height = _box.min.distanceTo(new THREE.Vector3(_box.min.x, _box.min.y, _box.max.z)),
                width = _box.min.distanceTo(new THREE.Vector3(_box.max.x, _box.min.y, _box.min.z)),
                depth = _box.min.distanceTo(new THREE.Vector3(_box.min.x, _box.max.y, _box.min.z));

            return {
                width,
                height,
                depth
            }
        }
        mesh._onDublicate = function (settings) {
            viewer._events._onDeletePart(this);
            let geo = this.geometry.clone(),
                {distance, copy, spacing, position} = settings,
                dim = ['x', 'y', 'z'],
                {height, width, depth} = this._boxSize(),
            translateMin = this._helper.geometry.boundingBox.min.clone().negate();

            geo.translate(translateMin.x, translateMin.y, translateMin.z);
            geo.translate(position.x, position.y, position.z);
            geo.translate(distance.x, distance.y, distance.z);

            let delta = 0;
            for (let i = 0; i < copy.x; i++) {
                for (let j = 0; j < copy.z; j++) {
                    for (let k = 0; k < copy.y; k++) {
                        // if (
                        //     i == 0 && j == 0 && k == 0
                        // ) continue;
                        let position = new THREE.Vector3(
                            ((i + delta) * width) + spacing.x * (i + delta),
                            ((k + delta) * depth) + spacing.y * (k + delta),
                            ((j + delta) * height) + spacing.z * (j + delta)
                        );

                        if (
                            position.x > GUtils.CHAMPER.WIDTH ||
                            position.y > GUtils.CHAMPER.DEPTH ||
                            position.z > GUtils.CHAMPER.HEIGHT
                        ) continue;
                        let geoCopy = geo.clone();
                        geoCopy.translate(position.x, position.y, position.z);
                        let _model =new ModelPart(viewer, {orGeometry: geoCopy, name: `${mesh.name}(${copies++})`});
                        this.matrix.decompose(new THREE.Vector3(),_model.mesh.quaternion,_model.mesh.scale);
                    }
                }
            }
            // dim.forEach((dimension) => {
            //     for (let i = 0; i < copy[dimension]; i++) {
            //         let geoCopy = geo.clone(), index = i + 1;
            //         switch (dimension) {
            //             case dim[0]: {
            //                 geoCopy.translate(spacing.x * index, 0, 0);
            //                 break;
            //             }
            //             case dim[1]: {
            //                 geoCopy.translate(0, spacing.y * index, 0);
            //                 break;
            //             }
            //             case dim[2]: {
            //                 geoCopy.translate(0, 0, spacing.z * index);
            //                 break;
            //             }
            //         }
            //         new ModelPart(viewer, {orGeometry: geoCopy, name: `${mesh.name}(${copies++})`});
            //     }
            // })

        }
        this._addLabelPositin();
        this.toggleViewLabel();
        this.updateLabel();
        this.updateLabelValue();
    }

    remove() {
        this.mesh.parent.remove(this.mesh);

        this.labelContainer.innerHTML = "";
        this.labelContainer.parentNode.removeChild(this.labelContainer);
        if (this.mesh._onHtmlDeletePart) this.mesh._onHtmlDeletePart();
    }

    checkIfColision() {
        if (this.isInCollision) {
            if (!this.mesh.material.lastColor) {
                this.mesh.material.lastColor = this.mesh.material.color.clone();
            }
            this.mesh.material.color = new THREE.Color(GUtils.COLORS.RED);
        } else {
            if (this.mesh.material.lastColor) {
                this.mesh.material.color = this.mesh.material.lastColor;
                this.mesh.material.lastColor = null;
            }
        }
    }

    onCollisioin(isInCollision = false) {
        if (isInCollision != this.isInCollision) {
            this.isInCollision = isInCollision;
            this.checkIfColision();

        }
    }

    _addLabelPositin() {
        let {viewer} = this;
        let helper = new THREE.BoxHelper(this.mesh);
        helper.geometry.computeBoundingBox();

        let mesh = this.mesh._label_pivot = new THREE.Mesh(new THREE.SphereBufferGeometry(0.01, 1, 1));
        mesh.visible = false;
        // mesh.scale.multiplyScalar(10);
        mesh.position.copy(helper.geometry.boundingBox.min);

        viewer.model.updateMatrixWorld();
        this.mesh.updateMatrixWorld();
        mesh.updateMatrixWorld();
        THREE.SceneUtils.detach(mesh, viewer.model, this.mesh);
        // this.mesh.add(mesh);
        let labelContainer = this.labelContainer = document.createElement('div');
        labelContainer.className = "label-container";
        labelContainer.innerHTML = `
        <div class="label-title">${this.mesh.name}</div>
        <div></div>
        `
        this.viewer.labelContainer.appendChild(labelContainer);
        [
            {
                dim: 'x'
            },
            {
                dim: 'y'
            },
            {
                dim: 'z'
            }
        ].forEach((el) => {
            labelContainer.children[1].innerHTML += `
            <div class="d-flex s-c a-c label-item">
                <b>${el.dim}:</b>
                <span data-dim="${el.dim}"></span>
            </div>
            `;
        })
    }

    canUpdate() {
        return this.mesh.parent._category == GUtils.CATEGORIES.TEMP_TRANSFORM_CONTAINER;
    }

    updateLabelValue() {
        if (this.canUpdate()) {
            [].forEach.call(this.labelContainer.children[1].children, (el) => {

                let domLabel = el.children[1],
                    dimension = domLabel.dataset.dim;
                domLabel.innerText = this.mesh._label_pivot._global_pst[dimension].toFixed(2);
            });
        }

    }


    toggleSelect(isSelect, from, toS) {
        let el = this.mesh,
            child = el;

        el.isSelected = isSelect;
        if (el._onHtmlSelectPart) el._onHtmlSelectPart();
        if (isSelect) {

            el.updateMatrixWorld();
            el.material = this.viewer.model._selectedMaterial.clone();
            THREE.SceneUtils.attach(el, from, toS);
            this.checkIfColision();
        } else {
            child.parent.updateMatrixWorld();
            child._orParent.updateMatrixWorld();
            child.updateMatrixWorld();
            child.material = child._material;
            THREE.SceneUtils.detach(child, child.parent, child._orParent);
            child._helper.last_center = child.position.clone();
            // child._helper.position.copy(child.position.clone());
        }

        this.toggleViewLabel();
    }

    toggleViewLabel() {
        let index = this.labelContainer.className.match(GUtils.CLASSES.HIDDEN);
        if (!this.canUpdate()) {

            if (!index) this.labelContainer.className += ` ${GUtils.CLASSES.HIDDEN}`;
        } else {
            if (index) this.labelContainer.className = this.labelContainer.className.replace(` ${GUtils.CLASSES.HIDDEN}`, '');
        }

    }

    updateLabel() {
        this.updateLabelPosition();
        this.updateLabelVisibilty();
    }

    updateLabelPosition() {
        if (this.canUpdate()) {
            let pst = this.viewer.toScreenPosition(this.mesh._label_pivot);
            this.labelContainer.style.left = `${pst.x}px`;
            this.labelContainer.style.top = `${pst.y}px`;
        }
    }

    updateLabelVisibilty() {
        if (this.canUpdate()) {
            let {viewer, mesh, labelContainer} = this;
            viewer.scene.updateMatrixWorld();
            mesh._label_pivot.parent.updateMatrixWorld();
            var vector = new THREE.Vector3();
            vector.setFromMatrixPosition(mesh._label_pivot.matrixWorld);

            mesh._label_pivot._global_pst = vector;
            labelContainer.className = labelContainer.className.replace(" out", '');
            labelContainer.className +=
                viewer.camera.position.distanceTo(vector) < viewer.camera.position.distanceTo(viewer.controls.target) ? '' : ' out';
        }
    }
}
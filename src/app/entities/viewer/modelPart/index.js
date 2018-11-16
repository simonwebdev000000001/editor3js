import GUtils from "../../utils";

export default class ModelPart {

    constructor(viewer, {orGeometry, name}) {
        this.viewer = viewer;
        let parent = viewer.model,
            mesh = this.mesh = new THREE.Mesh(orGeometry, viewer.model._curMaterial.clone());
        mesh.isIntersectable = true;
        mesh._category = GUtils.CATEGORIES.STL_LOADED_PART;
        parent.add(mesh);
        mesh.name = name;

        mesh._control = this;
        if (viewer._ui) {
            viewer._ui.onLoadPart(mesh);
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
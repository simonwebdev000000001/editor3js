import GUtils from '../../utils';
import SupportTools from './supportTools';
import Model from './model';


export default class ModelPart extends Model {


  constructor(viewer, { orGeometry, name, fromMesh, shouldRecalcCenter, geoemtryTomerge }) {
    super(viewer);
    let center;
    if (shouldRecalcCenter) {
      let tempHelper = new THREE.BoxHelper(new THREE.Mesh(orGeometry));
      center = tempHelper.geometry.boundingSphere.center.clone().negate();
      orGeometry.translate(center.x, center.y, center.z);
    }
    let parent = viewer.model,
      mesh = this.mesh = this.baseMesh = new THREE.Mesh(orGeometry, this.materials.base);


    this.geoemtryTomerge = geoemtryTomerge;
    mesh._geometry = new THREE.Geometry().fromBufferGeometry(orGeometry);
    mesh.buffer_geometry = orGeometry;

    if (shouldRecalcCenter) mesh.position.copy(center.negate());
    if (fromMesh) {
      fromMesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
      mesh.updateMatrix();
      if (fromMesh._dublicats) mesh._dublicats = fromMesh._dublicats;
    }

    mesh._helper = new THREE.BoxHelper(mesh, GUtils.COLORS.YELLOW);
    mesh._helper._id = ModelPart.IDS++;
    mesh._id = ModelPart.IDS++;
    mesh._helper.geometry.computeBoundingBox();
    mesh._helper.material.visible = false;
    mesh._helper.name = name + Date.now();
    mesh.isIntersectable = true;
    mesh._category = GUtils.CATEGORIES.STL_LOADED_PART;
    parent.add(mesh);
    mesh.name = name;
    if (fromMesh) {
      mesh._helper.isOnePart = true;
    }
    mesh._control = this;
    if (viewer._ui) {
      viewer._ui.onLoadPart(mesh);
    }
    mesh._onDublicate = function(settings, isHistory) {
      let originMesh = this;
      originMesh._dublicats = [];
      viewer._events._onDeletePart(originMesh, true);
      let geo = this.geometry.clone();
      geo.scale(mesh.scale.x, mesh.scale.y, mesh.scale.z);
      // let cloneMatrix = originMesh.matrixWorld.clone();
      // geo.applyMatrix(cloneMatrix);//TODO: should use transform goemetry

      let
        tempMesh = new THREE.Mesh(geo),
        tempBox = new THREE.BoxHelper(tempMesh),
        { distance, copy, spacing, position } = settings,
        dim = ['x', 'y', 'z'];

      tempBox.geometry.computeBoundingBox();
      let { height, width, depth, _helper } = tempMesh._boxSize(),
        translateMin = _helper.geometry.boundingBox.min.clone().negate();
      translateMin.add(position);
      translateMin.add(distance);
      let delta = 0;
      for (let i = 0; i < copy.x; i++) {
        for (let j = 0; j < copy.z; j++) {
          for (let k = 0; k < copy.y; k++) {
            // if (
            //     i == 0 && j == 0 && k == 0
            // ) continue;
            let _position = new THREE.Vector3(
              ((i + delta) * width) + spacing.x * (i + delta),
              ((k + delta) * depth) + spacing.y * (k + delta),
              ((j + delta) * height) + spacing.z * (j + delta),
            );
            _position.add(translateMin);
            if (
              position.x > GUtils.CHAMPER.WIDTH ||
              position.y > GUtils.CHAMPER.DEPTH ||
              position.z > GUtils.CHAMPER.HEIGHT
            ) continue;
            let geoCopy = geo.clone();
            // geoCopy.translate(position.x, position.y, position.z);
            // geoCopy.translate(position.x, position.y, position.z);
            let tempMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1));
            tempMesh.position.copy(_position);
            originMesh.matrix.decompose(new THREE.Vector3(), tempMesh.quaternion, new THREE.Vector3());
            tempMesh.updateMatrix();
            let _model = new ModelPart(viewer, {
              orGeometry: geoCopy,
              fromMesh: tempMesh,
              name: `${mesh.name}(${ModelPart.COPIES++})`,
            });
            // _model.mesh.position.copy(_position);
            originMesh._dublicats.push(_model);
            // _model.mesh.quaternion.copy(originMesh.quaternion)

            _model.mesh.updateMatrixWorld();
            _model.mesh.updateMatrix();
          }
        }
      }

      if (isHistory) return;
      viewer.datGui.editStack.push({
        startEditState: {//undo
          elements: [originMesh],
          apply: function() {
            const mesh = this.elements[0];
            mesh._dublicats.forEach((dublicate) => {
              dublicate.remove(true);
            });
            const modelNew = new ModelPart(viewer, {
              fromMesh: mesh,
              orGeometry: mesh.geometry,
              name: mesh.name,
            });
            modelNew.baseMesh._dublicats = mesh._dublicats;

            viewer.datGui.editStack.refreshHistoryModel(
              [mesh, mesh._helper],
              [modelNew.baseMesh, modelNew.baseMesh._helper],
            );
          },
        },
        endEditState: {//redo
          elements: [originMesh],
          apply: function() {
            const mesh = this.elements[0];
            const { _dublicats } = mesh;
            mesh._onDublicate(settings, true);

            viewer.datGui.editStack.refreshHistoryModel(
              [
                ..._dublicats.map((el) => el.baseMesh),
                ..._dublicats.map((el) => el.baseMesh._helper),
              ],
              [
                ...mesh._dublicats.map((el) => el.baseMesh),
                ...mesh._dublicats.map((el) => el.baseMesh._helper),
              ],
            );
          },
        },
      });

    };

    this.supportTools = new SupportTools(this);
    this._addLabelPositin();
    this.toggleViewLabel();
    this.updateLabel();
    this.updateLabelValue();
  }

  baseSimpleMesh() {
    this.baseMesh.updateMatrixWorld();
    let orGeometry = this.baseMesh.geometry.clone();

    let newMeshGeo = new THREE.Geometry().fromBufferGeometry(orGeometry);


    newMeshGeo.applyMatrix(this.baseMesh.matrixWorld);

    let mesh = new THREE.Mesh(newMeshGeo, this.baseMesh.material.clone());

    mesh.updateMatrix();
    mesh.updateMatrixWorld();

    return mesh;
  }

  remove(isHistory) {
    this.mesh.parent.remove(this.mesh);

    this.labelContainer.innerHTML = '';
    this.labelContainer.parentNode.removeChild(this.labelContainer);
    if (this.mesh._onHtmlDeletePart) this.mesh._onHtmlDeletePart();

    if (isHistory) return;
    const model = this;
    this.viewer.datGui.editStack.push({
      startEditState: {
        elements: [model.baseMesh],
        apply: function() {
          const mesh = this.elements[0];
          const modelNew = new ModelPart(model.viewer, {
            orGeometry: mesh.geometry,
            name: mesh.name,
            shouldRecalcCenter: true,
          });
          mesh.matrix.decompose(modelNew.baseMesh.position, modelNew.baseMesh.quaternion, modelNew.baseMesh.scale);
          model.viewer.datGui.editStack.refreshHistoryModel(
            [mesh, mesh._helper],
            [modelNew.baseMesh, modelNew.baseMesh._helper],
          );
        },
      },
      endEditState: {
        elements: [model.baseMesh],
        apply: function(curState) {
          const mesh = this.elements[0];
          model.viewer._events._onDeletePart(mesh);
          mesh.updateMatrixWorld();
          mesh.updateMatrix();
        },
      },
    });
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
    let { viewer } = this;
    let helper = new THREE.BoxHelper(this.mesh);
    helper.geometry.computeBoundingBox();

    let mesh = this.mesh._label_pivot = new THREE.Mesh(new THREE.SphereBufferGeometry(1, 1, 1));
    mesh.visible = false;

    // mesh.scale.multiplyScalar(10);
    let v1 = helper.geometry.boundingSphere.center.clone(),
      v2 = helper.geometry.boundingBox.min.clone(),
      dist = v1.distanceTo(v2);
    mesh.position.addScaledVector(v2.sub(v1).normalize(), dist);
    this.mesh.add(mesh);
    let labelContainer = this.labelContainer = document.createElement('div');
    labelContainer.className = 'label-container';
    labelContainer.innerHTML = `
        <div class="label-title">${this.mesh.name}</div>
        <div></div>
        `;
    this.viewer.labelContainer.appendChild(labelContainer);
    [
      {
        dim: 'x',
      },
      {
        dim: 'y',
      },
      {
        dim: 'z',
      },
    ].forEach((el) => {
      labelContainer.children[1].innerHTML += `
            <div class="d-flex s-c a-c label-item">
                <b>${el.dim}:</b>
                <span data-dim="${el.dim}"></span>
            </div>
            `;
    });
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
      child._last_controls = child.parent;
      THREE.SceneUtils.detach(child, child.parent, child._orParent);
      child._helper.position.copy(child.position);
      // child._helper.last_center = child.position.clone();
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

  updateBoundingBoxTransform() {

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
      let { viewer, mesh, labelContainer } = this;
      viewer.scene.updateMatrixWorld();
      mesh._label_pivot.parent.updateMatrixWorld();
      var vector = new THREE.Vector3();
      vector.setFromMatrixPosition(mesh._label_pivot.matrixWorld);

      mesh._label_pivot._global_pst = vector;
      labelContainer.className = labelContainer.className.replace(' out', '');
      labelContainer.className +=
        viewer.camera.position.distanceTo(vector) < viewer.camera.position.distanceTo(viewer.controls.target) ? '' : ' out';
    }
  }
}
ModelPart.IDS = 0;
ModelPart.COPIES = 0;

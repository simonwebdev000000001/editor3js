import ModelPart from "../../modelPart";

export default class MainTransformControls {
    constructor(viewer) {
        this.viewer = viewer;
    }

    mergeSelected() {
        const {transformControls} = this.viewer;
        if (!transformControls.tempParent) {
            alert('You have to select at least 2 parts to merge into one');
        } else {
            const mergedParts = transformControls.tempParent.children.filter((el) => el.isIntersectable);
            if (mergedParts.length < 2) {
                return alert('You have to select at least 2 parts to merge into one')
            } else {
                this._mergeMeshes(mergedParts);
            }
        }

    }

    _mergeMeshes(mergedParts, isHistory) {
        const self = this;
        const {viewer} = this;
        let geoemtryTomerge = [];
        mergedParts.forEach((model) => {
            this.viewer._events._onDeletePart(model, true);
            let geo = model.geometry.clone();

            geo.name = model.name;
            geo.scale(model.scale.x, (model.scale.y), model.scale.z);
            geo.rotateX(model.rotation.x);//, (model.scale.y), model.scale.z);
            geo.rotateY(model.rotation.y);//, (model.scale.y), model.scale.z);
            geo.rotateZ(model.rotation.z);//, (model.scale.y), model.scale.z);
            geo.translate(model.position.x, (model.position.y), model.position.z);
            geoemtryTomerge.push(geo);
        });


        let orGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geoemtryTomerge);
        const modelPart = new ModelPart(viewer, {
            orGeometry,
            name: `Merged part ${mergedParts.length}`,
            shouldRecalcCenter: true,
            geoemtryTomerge
        });
        if (!isHistory) {
            viewer.datGui.editStack.push({
                startEditState: {
                    elements: [
                        modelPart.baseMesh,
                        ...mergedParts
                    ],
                    apply: function () {
                        const _els = [...this.elements];
                        const mesh = _els[0];
                        const meshEls = _els.splice(1);
                        const newMeshes = self.separateBackModels(mesh, true);
                        viewer.datGui.editStack.refreshHistoryModel(
                            [
                                ...meshEls,
                                ...meshEls.map((el) => el._helper)
                            ],
                            [
                                ...newMeshes,
                                ...newMeshes.map((el) => el._helper)
                            ]
                        );
                    }
                },
                endEditState: {
                    elements: [modelPart.baseMesh, ...mergedParts],
                    apply: function () {
                        const _els = [...this.elements];
                        const mesh = self._mergeMeshes(_els.splice(1), true);
                        viewer.datGui.editStack.refreshHistoryModel(
                            [
                                _els[0],
                                _els[0]._helper
                            ],
                            [
                                mesh,
                                mesh._helper
                            ]
                        );
                    }
                }
            });
        }
        return modelPart.baseMesh;
    }

    separateBackModels(model, isHistory) {
        const newModels = [];
        if (model._control.geoemtryTomerge) {
            this.viewer._events._onDeletePart(model, isHistory);
            const curGeo = model.geometry;

            curGeo.scale(model.scale.x, (model.scale.y), model.scale.z);
            curGeo.rotateX(model.rotation.x);
            curGeo.rotateY(model.rotation.y);
            curGeo.rotateZ(model.rotation.z);
            curGeo.translate(model.position.x, (model.position.y), model.position.z);


            let startFrom = {position: 0, normal: 0};
            model._control.geoemtryTomerge.forEach((orGeo, index) => {
                const orGeometry = new THREE.BufferGeometry();
                const positions = [];
                const normals = [];
                for (let i = startFrom.position + index, length = i + orGeo.attributes.position.array.length; i < length; i++) {
                    positions.push(curGeo.attributes.position.array[i]);
                    startFrom.position = i;
                }
                for (let i = startFrom.normal + index, length = i + orGeo.attributes.normal.array.length; i < length; i++) {
                    normals.push(curGeo.attributes.normal.array[i]);
                    startFrom.normal = i;
                }

                orGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), orGeo.attributes.position.itemSize));
                orGeometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), orGeo.attributes.normal.itemSize));

                const modelPart = new ModelPart(this.viewer, {
                    orGeometry,
                    name: orGeo.name,
                    shouldRecalcCenter: true
                });
                newModels.push(modelPart.baseMesh);
            });

        }
        return newModels;

    }

}
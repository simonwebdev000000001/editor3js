import ModelPart from "../../modelPart";

export default class MainTransformControls {
    constructor(viewer) {
        this.viewer = viewer;
    }

    mergeSelected() {
        const {viewer} = this;
        const {transformControls} = this.viewer;
        if (!transformControls.tempParent) return alert('You have to select at least 2 parts to merge into one');
        const mergedParts = transformControls.tempParent.children.filter((el) => el.isIntersectable);
        if (mergedParts.length < 2) {
            return alert('You have to select at least 2 parts to merge into one')
        } else {
            let geoemtryTomerge = [];
            mergedParts.forEach((model) => {
                this.viewer._events._onDeletePart(model);
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
            new ModelPart(viewer, {
                orGeometry,
                name: `Merged part ${mergedParts.length}`,
                shouldRecalcCenter: true,
                geoemtryTomerge
            });
            //:TODO temporary disable stack
            this.viewer.datGui.editStack.clear();
        }
    }

    separateBackModels(model) {
        if (model._control.geoemtryTomerge) {
            this.viewer._events._onDeletePart(model);
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

                new ModelPart(this.viewer, {
                    orGeometry,
                    name: orGeo.name,
                    shouldRecalcCenter: true
                });
            });

            //:TODO temporary disable stack
            this.viewer.datGui.editStack.clear();
        }

    }

}
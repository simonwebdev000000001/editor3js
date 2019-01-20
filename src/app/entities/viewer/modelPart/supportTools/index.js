export default class SupportTools {
    constructor(modelController) {
        this.model = modelController;
    }


    generateSupports(params) {
        const {model} = this;
        model.baseMesh.updateMatrixWorld();
        model.viewer._events.onTransformModel();

        // if (!this.supportGenerator) {
        let simpleMesh = model.baseSimpleMesh();
        // model.viewer.scene.add(simpleMesh);
        // console.log(simpleMesh);
        this.supportGenerator = new SupportGenerator(simpleMesh, new Octree(simpleMesh));
        // }

        // const supportMesh = this.makeSupportMesh();
        const supportGeometry = this.supportGenerator.generate(params);

        if (!supportGeometry) return;

        // support geometry is generated in world space; put it in the base mesh's
        // object space so that they can be transformed with the same matrix

        // const inverseMatrix = new THREE.Matrix4().getInverse(model.baseMesh.matrixWorld);
        // const pst = new THREE.Vector3();
        // // supportGeometry.applyMatrix(inverseMatrix);
        // inverseMatrix.decompose(pst, new THREE.Quaternion(), new THREE.Vector3());
        //
        // // model.baseMesh.matrix.decompose(supportMesh.position, supportMesh.rotation, supportMesh.scale);
        // supportGeometry.translate(pst.x, pst.y, pst.z);
        // supportGeometry.translate(model.baseMesh.position.x, model.baseMesh.position.y, model.baseMesh.position.z);


        // supportMesh.geometry = supportGeometry;
        // model.viewer.scene.add(supportMesh);
        // model.supportMesh = supportMesh;
        const addedModel = model.viewer.addModel({
            orGeometry: new THREE.BufferGeometry().fromGeometry(supportGeometry),
            name: `${ model.baseMesh.name} supports`,
            shouldRecalcCenter: true
        });
        // model.baseMesh.matrix.decompose(addedModel.baseMesh.position,addedModel.baseMesh.quaternion,addedModel.baseMesh.scale);
        // model.baseMesh.matrix.decompose(addedModel.baseMesh._helper.position,addedModel.baseMesh._helper.quaternion,addedModel.baseMesh._helper.scale);
        // addedModel.baseMesh.updateMatrix();
        // addedModel.baseMesh._helper.updateMatrix();
        // addedModel.baseMesh._helper.isOnePart = true;

    }

    makeSupportMesh() {
        const {model} = this;
        // if (!this.supportMesh) {
        const geo = new THREE.Geometry();
        this.supportMesh = new THREE.Mesh(geo, model.materials.base);
        this.supportMesh.name = "support";

        this.supportMesh.position.copy(model.baseMesh.position);
        this.supportMesh.rotation.copy(model.baseMesh.rotation);
        this.supportMesh.scale.copy(model.baseMesh.scale);
        // }

        return this.supportMesh;
    }
}
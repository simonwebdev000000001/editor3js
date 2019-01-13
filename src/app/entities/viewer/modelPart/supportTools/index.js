export default class SupportTools {
    constructor(modelController) {
        this.model = modelController;
    }

    removeSupports() {
        const {model} = this;
        if (model.supportMesh) {
            model.supportMesh.parent.remove(model.supportMesh);
            model.supportMesh = null;
        }
    }

    generateSupports(params) {
        const {model} = this;
        this.removeSupports();
        model.baseMesh.updateMatrixWorld();
        model.viewer._events.onTransformModel();

        // if (!this.supportGenerator) {
        let simpleMesh = model.baseSimpleMesh();
        // model.viewer.scene.add(simpleMesh);
        this.supportGenerator = new SupportGenerator(simpleMesh, model.getOctree(simpleMesh));
        // }

        const supportMesh = this.makeSupportMesh();
        const supportGeometry = this.supportGenerator.generate(params);

        if (!supportGeometry) return;

        // support geometry is generated in world space; put it in the base mesh's
        // object space so that they can be transformed with the same matrix

        const inverseMatrix = new THREE.Matrix4().getInverse(model.baseMesh.matrixWorld);
        supportGeometry.applyMatrix(inverseMatrix);


        // model.baseMesh.matrix.decompose(supportMesh.position, supportMesh.rotation, supportMesh.scale);

        supportMesh.geometry = supportGeometry;
        model.viewer.scene.add(supportMesh);
        model.supportMesh = supportMesh;
        this.supportsGenerated = true;
    }

    makeSupportMesh() {
        const {model} = this;
        // if (!this.supportMesh) {
        var geo = new THREE.Geometry();
        this.supportMesh = new THREE.Mesh(geo, model.materials.base);
        this.supportMesh.name = "support";

        this.supportMesh.position.copy(model.baseMesh.position);
        this.supportMesh.rotation.copy(model.baseMesh.rotation);
        this.supportMesh.scale.copy(model.baseMesh.scale);
        // }

        return this.supportMesh;
    }
}
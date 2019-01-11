export default class SupportTools {
    constructor(modelController) {
        this.model = modelController;
    }

    removeSupports() {
        const {model} = this;
        if(model.supportMesh)model.supportMesh.parent.remove(model.supportMesh);
    }

    generateSupports(params) {
        const {model} = this;
        this.removeSupports();

        model.viewer._events.onTransformModel();

        if (!this.supportGenerator) {
            let simpleMesh = model.baseSimpleMesh();
            this.supportGenerator = new SupportGenerator(simpleMesh, model.getOctree(simpleMesh));
        }

        var supportMesh = this.makeSupportMesh();
        var supportGeometry = this.supportGenerator.generate(params);
        if (!supportGeometry) return;

        // support geometry is generated in world space; put it in the base mesh's
        // object space so that they can be transformed with the same matrix
        var inverseMatrix = new THREE.Matrix4().getInverse(model.baseMesh.matrixWorld);
        supportGeometry.applyMatrix(inverseMatrix);

        supportMesh.geometry = supportGeometry;
        model.baseMesh.add(supportMesh);
        console.log(model);
        model.supportMesh = supportMesh;
        this.supportsGenerated = true;
    }

    makeSupportMesh() {
        const {model} = this;
        if (!this.supportMesh) {
            var geo = new THREE.Geometry();
            this.supportMesh = new THREE.Mesh(geo, model.materials.base);
            this.supportMesh.name = "support";

            // this.supportMesh.position.copy(model.baseMesh.position);
            // this.supportMesh.rotation.copy(model.baseMesh.rotation);
            // this.supportMesh.scale.copy(model.baseMesh.scale);
        }

        return this.supportMesh;
    }
}
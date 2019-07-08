import GUtils from "../../utils";

export default class GLControls {
    constructor(camera) {
        this.camera = camera;
        this._plane = new THREE.TransformControlsPlane();
        this._plane.space = 'local';

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
        this._scaleStart = new THREE.Vector3();
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


    }

    getPointer(event) {

        let pointer = event.changedTouches ? event.changedTouches[0] : event;

        let rect = event.target.getBoundingClientRect();

        return {
            x: (pointer.clientX - rect.left) / rect.width * 2 - 1,
            y: -(pointer.clientY - rect.top) / rect.height * 2 + 1,
            button: event.button
        };

    }

    editObject() {
    }

    pointerHover(intersect) {
        this.axis =this._plane.axis = intersect ? intersect.name : null;
        Object.assign(this._plane,this);
        this._plane.updateMatrixWorld();
    }

    pointerDown(pointer) {
        let {
            axis,
            ray,
            _plane,
            pointStart,
            pointEnd,
            rotationAxis,
            _scaleStart,
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
        let object = this.editObject();
        this._plane.updateMatrixWorld();

        this.controls.viewer.controls._enabled = this.controls.viewer.controls.enabled;
        this.controls.viewer.transformControls._enabled = this.controls.viewer.transformControls.enabled;
        this.controls.viewer.controls.enabled = this.controls.viewer.transformControls.enabled = false;


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
            _scaleStart.copy(object.scale);

            object.matrixWorld.decompose(worldPositionStart, worldQuaternionStart, worldScaleStart);

            pointStart.copy(planeIntersect.point).sub(worldPositionStart);

            if (space === 'local') pointStart.applyQuaternion(worldQuaternionStart.clone().inverse());

        }

        this.dragging = true;

    }

    pointerMove(pointer) {

    }

    pointerUp(pointer) {

        this.controls.viewer.controls.enabled = this.controls.viewer.controls._enabled;
        this.controls.viewer.transformControls.enabled = this.controls.viewer.transformControls._enabled;

        this.dragging = false;
        this.axis = null;

    };


    updateMtrix() {
        let object = this.editObject(),
            {

                camera,
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


        camera.updateMatrixWorld();
        camera.matrixWorld.decompose(cameraPosition, cameraQuaternion, cameraScale);
        if (this.camera instanceof THREE.PerspectiveCamera) {

            eye.copy(cameraPosition).sub(worldPosition).normalize();

        }
    }
}
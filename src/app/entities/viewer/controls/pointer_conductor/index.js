export default class PointerConductor {
    constructor(){
        let canvas = document.createElement('canvas'),
            size = 512;
        canvas.width = canvas.height = size;
        let ctx = canvas.getContext('2d');
        //ctx.fillRect(0, 0, canvas.width * 0.95, canvas.height);
        let centerX = size / 2,
            centerY = size / 2,
            radius = (size / 2) - 5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(0, 170, 255, 0.6)";
        ctx.stroke();

        ctx.beginPath();
        ctx.lineWidth = size * 0.2;
        ctx.arc(centerX, centerY, radius - ctx.lineWidth * 0.7, 0, 2 * Math.PI, false);
        ctx.strokeStyle = "rgba(0, 170, 255, 0.18)";
        ctx.stroke();


        this.pointer = new THREE.Mesh(new THREE.PlaneBufferGeometry(42, 42), new THREE.MeshBasicMaterial({
            transparent: true,
            depthTest: false,
            side: 2,
            map: new THREE.TextureLoader().load(canvas.toDataURL())
        }));
        this.pointer.conductor = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1));
        this.pointer.conductor.visible = this.pointer.visible =false;
        this.pointer.rotateA = function (inter) {
            if (!inter || !inter.face)return;
            let pointer = this,
                pos = inter.point.clone(),
                normal = inter.face.normal,
                interObj = inter.object,
                normalMatrix = new THREE.Matrix3().getNormalMatrix(interObj.matrixWorld);
            pointer.visible = true;

            normal.applyMatrix3(normalMatrix).normalize();

            pointer.conductor.position.copy(pos.clone().addScaledVector(normal, 1));
            pointer.position.copy(pointer.conductor.position);
            pos.addVectors(normal, pointer.conductor.position);
            pointer.conductor.lookAt(pos);


            let quat = pointer.conductor.quaternion.clone();
            pointer.quaternion.slerp(quat, 1)
            // let tween = new TWEEN.Tween({delta: 0}).to({delta: 1}, 200)
            // //.easing(TWEEN.Easing.Cubic.InOut)
            //     .onUpdate(function () {
            //         pointer.quaternion.slerp(quat, this.delta);
            //     }).onComplete(() => {
            //         tween = pointer.tween = null;
            //     }).onStop(()=> {
            //         tween = pointer.tween = null;
            //     })
            //     .start();
            // pointer.tween = tween;
        };
    }
    updateSize(dist){
        let _scale = dist/1000;
        this.pointer.scale.x= this.pointer.scale.y= this.pointer.scale.z=_scale;
    }
    hide(){
        this.pointer.visible = false;
    }
}
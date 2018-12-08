THREE.Mesh.prototype._boxSize = function () {
    let _helper = new THREE.BoxHelper(this),
        {
            width,
            height,
            depth
        } = _helper._boxSize();

    return {
        _helper,
        width,
        height,
        depth
    }
}
THREE.BoxHelper.prototype._boxSize = function () {
    let _helper = this;
    _helper.geometry.computeBoundingBox();
    let _box = _helper.geometry.boundingBox,
        height = _box.min.distanceTo(new THREE.Vector3(_box.min.x, _box.min.y, _box.max.z)),
        width = _box.min.distanceTo(new THREE.Vector3(_box.max.x, _box.min.y, _box.min.z)),
        depth = _box.min.distanceTo(new THREE.Vector3(_box.min.x, _box.max.y, _box.min.z));

    return {
        x: width,
        y: depth,
        z: height,
        width,
        height,
        depth
    }
}
THREE.Vector3.prototype.getPointInBetweenByPerc = function (pointB, percentage = 0.5) {

    let pointA = this.clone();
    let dir = pointB.clone().sub(pointA);
    let len = dir.length();
    dir = dir.normalize().multiplyScalar(len * percentage);
    return pointA.clone().add(dir);

}
THREE.Vector3.prototype.angleBtwThreePoint = function (B,C) {


    let A = this.clone();

    var AB = Math.sqrt(Math.pow(B.x-A.x,2)+ Math.pow(B.y-A.y,2));
    var BC = Math.sqrt(Math.pow(B.x-C.x,2)+ Math.pow(B.y-C.y,2));
    var AC = Math.sqrt(Math.pow(C.x-A.x,2)+ Math.pow(C.y-A.y,2));
    return Math.acos((BC*BC+AB*AB-AC*AC)/(2*BC*AB));

}
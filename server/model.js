exports.Supernota=function(id,testo,tags){
    this._id=id;
    this.testo=testo;
    this.tags=[];
    this.creataIl=null;
}
function GUID() {
    var S4 = function () {
        return Math.floor(
            Math.random() * 0x10000 /* 65536 */
        ).toString(16);
    };

    return (
        S4() + S4() + "-" +
            S4() + "-" +
            S4() + "-" +
            S4() + "-" +
            S4() + S4() + S4()
        );
}
exports.Supernota.newDefault=function() {
    return new  exports.Supernota(GUID(),"");
};
exports.Supernota.prototype.fillFromLine= function(testo) {
    var supernota=this;
    var dates = testo.match(/ #[0..9][0..9]\-[0..9][0..9]\-[0..9][0..9] /);

    var dates = testo.match(/\#\d\d-\d\d-\d\d*/g);
    supernota.dates = dates;
    supernota.tags = testo.match(/\#\S*/g);

    if (!dates)
        supernota.creataIl = Date.now();
    else {
        var date = dates[0].substring(1).split("-");

        var dt = new Date(
            2000 + parseInt(date[0]),
            parseInt(date[1]) - 1,
            parseInt(date[2])
        );


        supernota.creataIl = dt;
    }
}
exports.Supernota.newFromLine=function(testo) {
    var supernota = new  exports.Supernota(GUID(),testo);

    supernota.fillFromLine(testo);
    return supernota;
};


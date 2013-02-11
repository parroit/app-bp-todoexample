var appBp = require("app-bp");
var async=appBp.async;

var sys = require('sys');
exports.name="todos";

var auth=appBp.auth;
//var Validator=appBp.validator.Validator;

exports.routes={


    get:{
        '/todos':'todos.index@jinja:index',

        '/list':'todos.list@json'

    },
    post:{
        '/todos/delete':'todos.delete@json',
        '/todos/save':'todos.save@json',
        '/importa-todos':'todos.importaTodos@json'
    }
};

exports.delete = auth.authenticated(function () {
    var self=this;
    this.onCollection('todos', function (client,collection){
        collection.remove({_id:self.request.body.params._id},true,function(){
            self.renderer({status:"ok"});
        });

    });
});
exports.save = auth.authenticated(function () {
    var self=this;
    var nota = self.request.body.params;
    this.onCollection('todos', function (client,collection){
        var Supernota=require("./model").Supernota;
        if(nota._id){
            var supernota = new Supernota(nota._id,nota.testo);
            supernota.fillFromLine(nota.testo);

            collection.update({_id:nota._id},supernota,function(err,result){
                if(result==0)
                    throw new Error("Nota non trovata"+nota._id);
                else
                    self.renderer({_id:supernota._id});
            });
        }
        else{
            var supernota2 = Supernota.newFromLine(nota.testo);
            collection.insert(supernota2,function(err,result){
                if(result==0)
                    throw new Error("Impossibile inserire la nota");
                else
                    self.renderer({_id:supernota2._id});
            });
        }


    });
});
exports.list = auth.authenticated(function () {
    var self=this;
    this.onCollection('todos', function (err, collection) {
        var page=0;
        var searchValue="";
        var sort="";
        var direction=1;
        if (self.request.query.hasOwnProperty("page"))
            page=self.request.query.page;

        if (self.request.query.hasOwnProperty("value"))
            searchValue=decodeURIComponent(self.request.query.value);

        if (self.request.query.hasOwnProperty("sort"))
            sort=decodeURIComponent(self.request.query.sort);

        if (self.request.query.hasOwnProperty("direction"))
            direction=decodeURIComponent(self.request.query.direction);

        var cursor = collection.find({
            testo:{$regex:".*"+searchValue+".*"}
        });


        function countAndServe() {
            cursor.count(function (err, total) {
                cursor.skip(page * 12).limit(12).toArray(function (err, results) {

                    self.renderer({status:"ok",list:{pageContent:results, current:page, pageCount:Math.ceil(total / 12)}}, function () {
                        client.close();
                    });

                });
            });
        }

        if (sort){

            cursor=cursor.sort(sort,direction,countAndServe);
        } else{
            countAndServe();
        }
    });


});
exports.importaTodos=function (){
    var testo=this.request.body.testo;
    var self=this;
    var client = self.createMongoClient();
    var Supernota=require("./model").Supernota;

    function addLine(insertionTasks, line, collection) {
        insertionTasks.push(function (callback) {
            var supernota = Supernota.newFromLine(line);
            collection.insert(supernota, function (err, results) {
                callback(null, supernota._id);
            });
        });
    }

    client.open(function (err, p_client) {
        client.collection('todos', function (err, collection) {
            collection.remove(function(){

                var lines=testo.split("\n");
                var insertionTasks=[];
                for (var i= 0,l=lines.length;i<l;i++){
                    var line=lines[i];
                    if (line!=null && line!="")
                        addLine(insertionTasks, line, collection);
                }
                async.parallel(insertionTasks, function(err, results){

                    self.renderer({status:"ok",supernote:results});
                });
            });



        });
    });
};


exports.noop=function() {
   this.renderer({});
};


exports.index=function() {
    this.renderer({});
};


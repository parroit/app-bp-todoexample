function checkResponse(response, app, model,  success) {
    if (response.status == "error")
    {
        if (typeof response.error === 'object')
            app.error(JSON.stringify(response.error,null,true));
        else
            app.error(response.error);
    }
    else {
        if (response.status == "invalid")
            if (model)
            {
                model.error = response.error;
                app.error("Cannot save: data are not valid. Please check your data");
            }
            else
                app.error(response.error);

        else {
            if (response.status == "ok") {
                if (model)
                    model.error = null;
                success();
            } else {
                app.error("Invalid JSON response:" + JSON.stringify(response,null,true));
            }
        }
    }
}
define(function(require, exports, module) {
    var app=null;
    exports.initModule=function(application){
        app=application;

        app.angularApp.directive('ngBlur', function () {
            return function (scope, element, attrs) {

                element.bind('blur', function () {
                    scope.$eval(attrs.ngBlur);
                });
            }
        });

        app.angularApp.directive('ngEditNote', function () {
            return function (scope, element, attrs) {

                element.bind('click', function () {

                    setTimeout(function () {
                        element[0].firstElementChild.focus();
                    }, 1);

                });
            }
        });
    };

    function ImportPostsCtrl($scope, $http, $location,$routeParams) {
        $scope.importa=function(){
            $http.post("importa-todos",{testo:$scope.testo}).success(function (data) {
                checkResponse(data, app, null,  function(){
                    $location.path("/list");

                });
            });
        }

        function init(){
            $scope.testo="Inserire il testo dei todo da importare qui,uno per riga";
        }
        init();
    }
    function ListTodosCtrl($scope, $http, $location,$routeParams){
        function testo_renderer(testo) {
            var replaceText = testo
                .replace(/#(\S*)/g, "<span onclick=\"window.location='todos#/list/\%23$1';\" class='tag label label-info'>$1</span>")
                .replace(/@(\S*)/g, "<span onclick=\"window.location='todos#/list/@$1';\" class='contact label label-success'>$1</span>");

            if ($scope.searchValue) {
                var regExp = new RegExp("(" + $scope.searchValue + ")", "g");
                replaceText = replaceText.replace(regExp, "<span class='yellowed'>$1</span>");
            }

            return replaceText;
        }

        function date_renderer(val) {
            try {
                var d = new Date(val);
                var curr_date = d.getDate();
                var curr_month = d.getMonth() + 1; //Months are zero based
                var curr_year = d.getFullYear();
                return curr_date + "/" + curr_month + "/" + curr_year;
            } catch (e) {
                return String(e);
            }
        }

        $scope.setPage = function () {
            $scope.search(this.p);
            $scope.$apply();
        };

        $scope.deleteNote = function () {
            var note = this.n;
            note.editing = false;

            var params = {
                _id:note._id
            };
            $http.post("todos/delete", {params:params}).success(function (data) {

                $scope.search($scope.currentPage);

            });
        };
        $scope.editNote = function () {
            this.n.editing = true;
            if (this.n._id == null) {
                addNewPlaceHolder($scope.todos);
                this.n._id = 0;
            }


            //$scope.$apply();
        };
        $scope.saveNote = function () {
            var nota = this.n;
            nota.editing = false;

            nota.testoTagged = testo_renderer(nota.testo);
            var params = {
                _id:nota._id,
                testo:nota.testo
            };
            $http.post("todos/save", {params:params}).success(function (data) {
                nota.justSaved = true;

                nota._id = data._id;
                //$scope.$apply();
                setTimeout(function () {
                    nota.justSaved = false;
                    $scope.$apply();
                }, 2000);
            });
        };


        function addNewPlaceHolder(todos) {
            todos.push({
                _id:null,
                testoTagged:"Inserire il testo della nota qui",
                tags:[],
                creataIl:date_renderer(new Date().getTime())
            });
        }

        $scope.sortBy = function (field) {
            if (field == $scope.sort) {
                $scope.direction = ($scope.direction == 1 ? -1 : 1);
            } else {
                $scope.sort = field;
            }

            $scope.search(0);

        };

        $scope.search = function (page) {
            var params = {
                page:page,
                value:$scope.searchValue,
                sort:$scope.sort,
                direction:$scope.direction
            };
            $http.get('list', {params:params}).success(function (data) {
                checkResponse(data, app, null,  function(){
                    var todos = data.list.pageContent;
                    todos.forEach(function (it) {
                        it.creataIl = date_renderer(it.creataIl);
                        it.testoTagged = testo_renderer(it.testo);
                        it.editing = false;
                        it.justSaved = false;
                    });
                    addNewPlaceHolder(todos);
                    $scope.currentPage = page;
                    $scope.allPages = [];

                    $scope.totalPages = data.list.pageCount;
                    for (var p = $scope.currentPage - 3; p <= $scope.currentPage + 3; p++)
                        $scope.allPages.push(p);
                    $scope.todos = todos;
                });

            });
        };
        function init(){
            $scope.searchValue = $routeParams.tagName;
            $scope.sort = '';
            $scope.direction = 1;
            $scope.search(0);
        }
        init();

    }


    exports.route=function($routeProvider){
        $routeProvider.
            when('/list/:tagName', {templateUrl:'todo/todos/list.html', controller:ListTodosCtrl}).
            when('/list', {templateUrl:'todo/todos/list.html', controller:ListTodosCtrl}).
            when('/import', {templateUrl:'todo/todos/import.html', controller:ImportPostsCtrl});

    }
});
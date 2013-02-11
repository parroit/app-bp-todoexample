var app=require("app-bp");
app.useDb('todo');
app.runControllers({

    todos:require("./todos")

});

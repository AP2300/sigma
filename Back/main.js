var express               = require("express"),
    app                   = express(),
    BodyParser            = require("body-parser"),
    passport              = require("passport"),
    LocalStrategy         = require("passport-local"),
    // passportLocalMongoose = require("passport-local-mongoose"),
    FP                    = require("express-fileupload"),
    MethodOverride        = require("method-override"),
    flash                 = require("connect-flash"),
    User                  = require("./models/user");

app.set("port",process.env.PORT||3000);
app.use(BodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(FP());
app.use(MethodOverride("_method"));
app.use(flash());

//todo el codigo aqui//

app.get("/home", function(req, res){
    res.render("index");
})

///////////////////////

app.listen(app.get("port"), function(){
    console.log("servidor iniciado");  
});
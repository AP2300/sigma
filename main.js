var express               = require("express"),
    app                   = express(),
    BodyParser            = require("body-parser"),
    passport              = require("passport"),
    LocalStrategy         = require("passport-local"),
    // passportLocalMongoose = require("passport-local-mongoose"),
    FP                    = require("express-fileupload"),
    MethodOverride        = require("method-override"),
    flash                 = require("connect-flash"),
    Sql                   =require("mysql"),
    User                  = require("./models/user");

//Config
app.set("port",process.env.PORT||3000);
app.use(BodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(FP());
app.use(MethodOverride("_method"));
app.use(flash());

//coneccion a mysqul//
// var connection = mysql.createConnection({
//     host     : 'localhost',
//     user     : 'me',
//     password : 'secret',
//     database : 'my_db'
//   });
//  connection.connect();  

//todo el codigo aqui//

app.get("/home", function(req, res){
    res.render("index");
})

app.get("/login", function(req, res){
    res.render("login");
})

app.get("/admin", function(req,res){
    res.render("admin");
})

app.get("/contactanos", function(req, res){
    res.render("contact");
})

///////////////////////

app.listen(app.get("port"), function(){
    console.log("servidor iniciado");  
});
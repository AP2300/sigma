var responses = {
    messageErr:"",
    messageOK:"",
}

var express               = require("express"),
    app                   = express(),
    BodyParser            = require("body-parser"),
    passport              = require("passport"),
    LocalStrategy         = require("passport-local"),
    // passportLocalMongoose = require("passport-local-mongoose"),
    FP                    = require("express-fileupload"),
    MethodOverride        = require("method-override"),
    flash                 = require("connect-flash"),
    Bcrypt                = require("bcryptjs"),
    jwt                   = require("jsonwebtoken")  
    Sql                   = require("mysql"),
    User                  = require("./models/user");

//Config
app.set("port",process.env.PORT||3002);
app.use(BodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(FP());
app.use(MethodOverride("_method"));
app.use(flash());

//conexion a mysql//
var DB = Sql.createConnection({
    host     : "remotemysql.com",
    port     : "3306",
    user     : '7HTdwmHsRH',
    password : 'aFi1Lr7p3K',
    database : '7HTdwmHsRH'
  });

 DB.connect((error)=>{
     if(error) console.log(error);
     else console.log("DB conectada");
 });  

//todo el codigo aqui//

app.get("/home", function(req, res){
    res.render("index");
})

app.get("/login", function(req, res){
    res.render("login");
})

app.get("/admin", function(req,res){
    res.render("admin", {responses});
    responses.messageErr=""
    responses.messageOK=""
})

app.get("/contactanos", function(req, res){
    res.render("contact");
})

app.post("/register", (req,res)=>{
    console.log(req.body.data);
    registerData = req.body.data;

    DB.query("SELECT Nombre, Correo FROM Users WHERE Nombre = ? OR Correo = ?", [registerData.name, registerData.email], async (error, results)=>{
        if (error){
            console.log(error);
        }
        if(results.length>0){
            console.log(results.length);
            responses.messageErr = "El Nombre ya esta registrado.";
            responses.messageOK = "";
            console.log("en el query"+responses.messageErr);
            res.redirect("/admin");
        }
        
        console.log("antes del if"+responses.messageErr);
        let hash = await Bcrypt.hash(registerData.pass, 8);
        if(responses.messageErr===""){
            DB.query("INSERT INTO Users SET ? ",{
                Nombre:registerData.name,
                Correo:registerData.email,
                Clave:hash
            }, (err, result)=>{
                if(err) console.log(err)
                else {
                    console.log(3);
                    responses.messageOK = "El registro fue hecho satisfactoriamente.";
                    responses.messageErr = ""; 
                    res.redirect("/admin");
                }
            })
        }
    })
    })

///////////////////////

app.listen(app.get("port"), function(){
    console.log("servidor iniciado");  
});
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
app.set("port",process.env.PORT||3000);
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
    res.render("admin");
})

app.get("/contactanos", function(req, res){
    res.render("contact");
})

app.post("/register", async (req,res)=>{
    console.log(req.body.data);
    registerData = req.body.data;
    DB.query("SELECT Correo FROM Users WHERE Correo = ?", [registerData.email], async (error, results)=>{
        if (error){
            console.log(error);
        }
        if(results.length>0){
            res.render("admin",{messageErr:"el email se encuentra en uso."});
        }
    })
    let hash = await Bcrypt.hash(registerData.pass, 8);
    DB.query("INSERT INTO Users SET ? ",{
        Nombre:registerData.name,
        Correo:registerData.email,
        Clave:hash
    }, (err, result)=>{
        console.log("hola");
        if(err) console.log(err);
        else res.render("admin", {messageOK:"usuario registrado correctamente"})
    })
})

///////////////////////

app.listen(app.get("port"), function(){
    console.log("servidor iniciado");  
});
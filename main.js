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
    res.render("admin", {responses});
})

app.get("/contactanos", function(req, res){
    res.render("contact");
})

app.post("/register", async (req,res)=>{
    var redirect = false;
    console.log(req.body.data);
    registerData = req.body.data;

    DB.query("SELECT Nombre FROM Users WHERE Nombre = ?", [registerData.name], (error, results)=>{
        if (error){
            console.log(1);
            console.log(error);
        }
        if(results.length>0){
            console.log(1.1);
            responses.messageErr = "El Nombre ya esta registrado.";
            responses.messageOK = "";
            redirect = true;
        }
    })

    DB.query("SELECT Correo FROM Users WHERE Correo = ?", [registerData.email], (error, results)=>{
        if (error){
            console.log(2);
            console.log(error);
        }
        if(results.length>0){
            console.log(2.1);
            responses.messageErr = "El email ya esta registrado.";
            responses.messageOK = "";  
            redirect = true;
        }
    }) 

    let hash = await Bcrypt.hash(registerData.pass, 8);

    
    if (responses.messageErr !== "") {
        res.redirect("/admin");
    } else if (responses.messageErr === "") {
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

///////////////////////

app.listen(app.get("port"), function(){
    console.log("servidor iniciado");  
});
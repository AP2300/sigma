const bcrypt = require("bcryptjs/dist/bcrypt");

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
    cookieParser          = require("cookie-parser")

//Config
app.set("port",process.env.PORT||3002);
app.use(BodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(FP());
app.use(MethodOverride("_method"));
app.use(flash());
app.use(cookieParser());

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
    res.render("login", {responses});
    responses.messageErr = "";
    responses.messageOk = "";
})

app.post("/login", function(req, res){
    loginData = req.body.data;
    console.log(loginData);
    DB.query("SELECT id, correo, clave from usuarios WHERE correo = ?", [loginData.email], async (error, results) => {
        console.log(results);
        if(error) console.log(error);
        if(results.length > 0) {
            await bcrypt.compare(loginData.pass, results[0].clave, function(err, result) {
                if(err) console.log(err);
                if(result) {
                    const id = results[0].id;

                    const token = jwt.sign({ id }, process.env.JWT_SECRET||"mysupersecretpassword", {
                        expiresIn: process.env.JWT_EXPIRES_IN||"2h"
                    });

                    console.log(`The token is ${token}`);

                    const cookieOptions = {
                        expires: new Date(
                            Date.now() + process.env.JWT_COOKIE_EXPIRES||2 * 60 * 60 * 1000
                        ),
                        httpOnly: true
                    }
                    
                    res.cookie('jwt', token, cookieOptions);
                    
                    res.redirect("/home");
                }
                else {
                    responses.messageErr = "La contraseña ingresada es inválida."
                    res.redirect("/login");
                } 
            });
        } else {
            responses.messageErr = "El correo no se encuentra registrado en el sistema."
            console.log(responses.messageErr)
            res.redirect("/login");
        }
    })
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

    DB.query("SELECT nombre, correo FROM usuarios WHERE nombre = ? OR correo = ?", [registerData.name, registerData.email], async (error, results)=>{
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
            DB.query("INSERT INTO usuarios SET ? ",{
                nombre:registerData.name,
                correo:registerData.email,
                clave:hash,
                tipo_usuario:registerData.optionType,
                cargo:registerData.optionPos
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

    // DB.query("SELECT Correo FROM Users WHERE Correo = ?", [registerData.email], (error, results)=>{
    //     if (error){
    //         console.log(2);
    //         console.log(error);
    //     }
    //     if(results.length>0){
    //         console.log(2.1);
    //         responses.messageErr = "El email ya esta registrado.";
    //         responses.messageOK = "";
    //     }
    // }) 


///////////////////////

app.listen(app.get("port"), function(){
    console.log("servidor iniciado");  
});
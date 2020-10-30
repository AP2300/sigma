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
var DBconfig = {
    host     : "remotemysql.com",
    port     : "3306",
    user     : '7HTdwmHsRH',
    password : 'aFi1Lr7p3K',
    database : '7HTdwmHsRH'
  };

var DB;
handleDisconnect(DBconfig)

//  DB.connect((error)=>{
//      if(error) {
//          DB.connect();
//          console.log(error);
//     }
//      else console.log("DB conectada");
//  });  

//todo el codigo aqui//

app.get("/home", function(req, res){
    res.render("index");
})

app.get("/login", function(req, res){
    res.render("login", {responses});
    responses.messageErr = "";
    responses.messageOk = "";
})

app.get("/catalog", (req, res)=>{
    var ProductoData = []
    DB.query("SELECT * FROM producto", (err, results)=>{
        if(err) console.log(err);
        else {
            ProductoData = results
            res.render("catalog", {ProductoData:ProductoData});
        }
    })
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
    var contactoData=[];
    DB.query("SELECT * FROM contactoLog", (error, results)=>{
       if(error){
           console.log(error);
       }else{
           contactoData=results;
           console.log(contactoData);
           
           res.render("admin", {responses:responses, contactoData:contactoData});
           responses.messageErr="";
           responses.messageOK="";
       }
    });
});

app.post("/adminAddProduct", (req, res)=>{
    let DataProducto = req.body.data;
    DB.query("SELECT nombre FROM productos WHERE nombre = ?", [DataProducto.name], async (error, results)=>{
        if (error){
            console.log(error);
        }
        if(results.length>0){
            responses.messageErr = "El Nombre ya esta registrado.";
            responses.messageOK = "";
            res.redirect("/admin");
        }
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
                    responses.messageOK = "El registro fue hecho satisfactoriamente.";
                    responses.messageErr = ""; 
                    res.redirect("/admin");
                }
            })
        }
    })
    })

app.get("/contactanos", function(req, res){
    res.render("contact");
})

app.post("/contactanos", (req, res)=>{
    Data=req.body.data;
    DB.query("INSERT INTO contactoLog SET ? ",{
        NombreEmpresa: Data.NombreEmpresa,
        RIF: Data.RIF,
        TipoEntidad: Data.TipoEntidad,
        Nombre: Data.Nombre,
        Apellido: Data.Apellido,
        Email: Data.Email,
        Pais: Data.Pais,
        Estado: Data.Estado,
        Ciudad: Data.Ciudad,
        Comentario: Data.Comentario
    }, (err, result)=>{
        if(err){
            console.log(err);
        }else{
            res.redirect("/home");
        }
    })
})

app.post("/register", (req,res)=>{
    registerData = req.body.data;

    DB.query("SELECT nombre, correo FROM usuarios WHERE nombre = ? OR correo = ?", [registerData.name, registerData.email], async (error, results)=>{
        if (error){
            console.log(error);
        }
        if(results.length>0){
            responses.messageErr = "El Nombre ya esta registrado.";
            responses.messageOK = "";
            res.redirect("/admin");
        }
        
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

function handleDisconnect() {
    DB = Sql.createConnection(DBconfig); // Recreate the connection, since
                                                    // the old one cannot be reused.
  
    DB.connect(function(err) {              // The server is either down
      if(err) {                                     // or restarting (takes a while sometimes).
        console.log('error when connecting to db:', err);
        setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
      }else{
          console.log("DB conectada");
      }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meandntime.
                                            // If you're also serving http, display a 503 error.
    DB.on('error', function(err) {
      console.log('db error', err);
      if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
        handleDisconnect();                         // lost due to either server restart, or a
      } else {                                      // connnection idle timeout (the wait_timeout
        throw err;                                  // server variable configures this)
      }
    });
  }
  
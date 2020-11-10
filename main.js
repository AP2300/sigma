var responses = {
    messageErr:"",
    messageOK:"",
    PmessageErr:"",
    PmessageOK: ""
}

var Sesion;

var express               = require("express"),
    app                   = express(),
    BodyParser            = require("body-parser"),
    passport              = require("passport"),
    LocalStrategy         = require("passport-local"),
    // passportLocalMongoose = require("passport-local-mongoose"),
    FP                    = require("express-fileupload"),
    MethodOverride        = require("method-override"),
    flash                 = require("connect-flash"),
    bcrypt                = require("bcryptjs"),
    jwt                   = require("jsonwebtoken")  
    Sql                   = require("mysql"),
    session               = require("express-session"),
    MySQLStore            = require("express-mysql-session")(session);
    cookieParser          = require("cookie-parser"),
    fs                    = require("fs"),
    { v4: uuidv4 }        = require('uuid');

//Config
app.set("port",process.env.PORT||3000);
app.use(BodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(FP());
app.use(MethodOverride("_method"));
app.use(flash());
app.use(cookieParser());

//conexion a mysql//
var DBconfig = {
    connectionLimit : 1,
    host     : "remotemysql.com",
    port     : "3306",
    user     : '7HTdwmHsRH',
    password : 'aFi1Lr7p3K',
    database : '7HTdwmHsRH'
};

var DB;
DB = Sql.createPool(DBconfig);
/*DB.connect((err) => {
    if(err) console.log(err);
    else console.log("DB conectada");
})*/
//setTimeout(handleDisconnect, 3000);

//configurado midleware para la sesion//

var sessionStore = new MySQLStore({
    expiration: 10000*30,
    clearExpired: true,
    checkExpirationInterval: 10000*60,
    createDatabaseTable: true,
    schema: {
        tableName: 'USERS_SESSIONS',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
}, DB);

app.use(session({
    key: '69Atu22GZTSyDGW4sf4mMJdJ42436gAs',
    secret: '3dCE84rey8R8pHKrVRedgyEjhrqGT5Hz',
    store: sessionStore,
    resave: false,
    saveUninitialized: true
}));
///////////////////////////////////////

//  DB.connect((error)=>{
//      if(error) {
//          DB.connect();
//          console.log(error);
//     }
//      else console.log("DB conectada");
//  });  

//todo el codigo aqui//

app.get("/", function (_, res) { 
    res.redirect("/home");
})

app.get("/home",function(req, res){
    IsAuthenticated(req.session.user);
    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
        if(Sesion.isAdmin){
            var isAdmin = true;
        } else var isAdmin = false;
    } else var isAdmin = false;
    res.render("index", {Sesion:Sesion,isAdmin:isAdmin});
})

app.get("/login", function(req, res){
    IsAuthenticated(req.session.user);
    res.render("login", {Sesion:Sesion,responses});
    responses.messageErr = "";
    responses.messageOk = "";
})

app.get("/catalog", (req, res)=>{
    IsAuthenticated(req.session.user);
    var ProductoData = []
    DB.query("SELECT * FROM producto", (err, results)=>{
        if(err) console.log(err);
        else {
            ProductoData = results
            if(IsAuthenticated(req.session.user)!=null){
                Sesion=IsAuthenticated(req.session.user);
                if(Sesion.isAdmin){
                    var isAdmin = true;
                } else var isAdmin = false;
            } else var isAdmin = false;
            res.render("catalog", {Sesion:Sesion,ProductoData:ProductoData,isAdmin:isAdmin,responses:responses});
            responses.messageErr="";
            responses.messageOK="";
        }
    })
})

app.get("/product/:id", (req, res) =>{
    IsAuthenticated(req.session.user);
    const id = req.params.id;
    let Producto = "";
    DB.query("SELECT * FROM producto WHERE id = ?", [id], (err, results)=>{
        if(err) console.log(err);
        else {
            Producto = results;
            console.log(Producto);
            res.render("product", {Sesion:Sesion,Producto:Producto});
        }
    })
})

app.get("/buy", (req, res)=>{
    IsAuthenticated(req.session.user);
    var Car= [];
    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
        res.render("buy", {Sesion:Sesion,Car:Car,responses:responses});
        responses.messageErr="";
        responses.messageOK="";
        
    } else{
        Sesion=null
        res.redirect("/login");
    }
})

app.post("/login", function(req, res){
    loginData = req.body.data;
    let admin = false;
    DB.query("SELECT id, correo,tipo_usuario,clave from usuarios WHERE correo = ?", [loginData.email], async (error, results) => {
        console.log(results);
        if(error) console.log(error);
        if(results.length > 0) {
            await bcrypt.compare(loginData.pass, results[0].clave, function(err, result) {
                if(err) console.log(err);
                if(result) {

                    if(results[0].tipo_usuario==="admin") admin=true; 
                    
                    req.session.user = {
                        id: results[0].id,
                        nickname: results[0].correo,
                        isAuthed: true,
                        isAdmin: admin
                    };
                    console.log(admin);
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
    // IsAuthenticated(req.session.user);
    var contactoData=[];

    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
        if(Sesion.isAdmin){
            DB.query("SELECT * FROM contactoLog", (error, results)=>{
                if(error){
                    console.log(error);
                }else{
                    contactoData=results;
                    DB.query("SELECT * FROM sucursal", (error, results)=>{
                        if(error){
                            console.log(error);
                        }else{
                            DB.query("SELECT * FROM ganancias", (error, results)=>{
                                if(error){
                                    console.log(error);
                                }else{
                                    earningsData = results;
                                    res.render("admin", {responses:responses, contactoData:contactoData, Sesion:Sesion, sucursal: results, earningsData:earningsData});
                                    responses.messageErr="";
                                    responses.messageOK="";
                                }
                            });
                        }
                    });
                }
             });
        }else{
            res.redirect("/home");
        }
    }else{
        Sesion=null
        res.redirect("home");
    }
});

app.post("/adminAddProduct", (req, res)=>{
    let DataProducto = req.body;
    DB.query("SELECT nombre FROM producto WHERE nombre = ?", [DataProducto.name], async (error, results)=>{
        let imgSource;
        if (error){
            console.log(error);
        }
        if(results.length>0){
            responses.PmessageErr = "Este producto ya se encuentra en el sistema";
            responses.PmessageOK = "";
            res.redirect("/admin");
        }else{
            if(!req.files) return res.redirect("/admin");
            else{
                File = req.files.img;
                uniqueName = uuidv4();
                imgSource = `/Img-Producto/${uniqueName}${File.name.slice(File.name.indexOf("."))}`;
                File.mv(`./public/Img-Producto/${uniqueName}${File.name.slice(File.name.indexOf("."))}`, (err)=>{
                    if(err) console.log(err);
                })
            }
        }
        if(responses.PmessageErr===""){
            DB.query("INSERT INTO producto SET ?",{
                nombre:DataProducto.name,
                precio:DataProducto.price,
                tipo_medicamento:DataProducto.type,
                cantidad:DataProducto.quantity,
                descripcion:DataProducto.description,
                IMG:imgSource
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

app.get("/adminEditProduct/:id", (req, res) =>{
    console.log(`Editar ${req.params.id}`);
    var id = req.params.id;

    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
        if(Sesion.isAdmin){
            DB.query("SELECT * FROM producto WHERE id = ?", [id], async (error, results)=>{
                if (error){
                    console.log(error);
                } else{
                    var producto = results[0];
                    console.log(producto);
                    res.render("adminEditProduct", {Sesion:Sesion, producto:producto, responses:responses});
                }
            });
        } else {
            res.redirect("/catalog");
        }
    } else {
        res.redirect("/catalog");
    }
})

app.post("/adminEditProduct/:id", (req, res) => {
    var id = req.params.id;
    var DataProducto = req.body;
    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
        if(Sesion.isAdmin){
            DB.query("SELECT * FROM producto WHERE id = ?", [id], async (error, results)=>{
                if (error){
                    console.log(error);
                } else{
                    if(DataProducto.notChange != undefined) {
                        var query = {
                            nombre:DataProducto.name,
                            precio:DataProducto.price,
                            tipo_medicamento:DataProducto.type,
                            cantidad:DataProducto.quantity,
                            descripcion:DataProducto.description
                        }
                    } else {
                        File = req.files.img;
                        uniqueName = uuidv4();
                        imgSource = `/Img-Producto/${uniqueName}${File.name.slice(File.name.indexOf("."))}`;
                        File.mv(`./public/Img-Producto/${uniqueName}${File.name.slice(File.name.indexOf("."))}`, (err)=>{
                            if(err) {
                                console.log(err);
                                responses.messageOK = "";
                                responses.messageErr = "Ha ocurrido un error, intentelo nuevamente"; 
                                res.redirect(`/adminEditProduct/${id}`);
                            }
                        });
                        
                        var query = {
                            nombre:DataProducto.name,
                            precio:DataProducto.price,
                            tipo_medicamento:DataProducto.type,
                            cantidad:DataProducto.quantity,
                            descripcion:DataProducto.description,
                            IMG:imgSource
                        }
                    }
                    
                    DB.query("UPDATE producto SET ? WHERE id = ?",[query, id], (err, result)=>{
                        if(err) {
                            console.log(err);
                            responses.messageOK = "";
                            responses.messageErr = "Ha ocurrido un error, intentelo nuevamente"; 
                            res.redirect(`/adminEditProduct/${id}`);
                        } else {
                            responses.messageOK = "El producto fue actualizado satisfactoriamente.";
                            responses.messageErr = ""; 
                            res.redirect("/catalog");
                        }
                    })
                }
            });
        } else {
            res.redirect("/catalog");
        }
    } else {
        res.redirect("/catalog");
    }
})

app.get("/adminDeleteProduct/:id", (req, res) =>{
    var id = req.params.id;
    console.log(`eliminar ${id}`);

    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
        if(Sesion.isAdmin){
            DB.query("SELECT IMG FROM producto WHERE id = ?", [id], (error, results)=>{
                if(error){
                    console.log(error);
                    responses.messageErr = "Ha ocurrido un error, inténtelo nuevamente";
                    res.redirect("/catalog");
                }else{ 
                    var image = `./public/${results[0].IMG}`;
                    console.log(image);
                    DB.query("DELETE FROM producto WHERE id = ?", [id], (error, results)=>{
                        if(error){
                            console.log(error);
                            responses.messageErr = "Ha ocurrido un error, inténtelo nuevamente";
                            res.redirect("/catalog");
                        }else{
                            fs.unlink(image, function(err) {
                                if (err) {
                                    console.log(err);
                                    responses.messageOK = "El producto ha sido eliminado de forma exitosa";
                                    res.redirect("/catalog");
                                } else {
                                    responses.messageOK = "El producto ha sido eliminado de forma exitosa";
                                    res.redirect("/catalog");
                                }
                            });
                            
                        }
                    });
                }
            });
        }else{
            res.redirect("/catalog");
        }
    }else{
        Sesion=null
        res.redirect("/catalog");
    }
})

app.post("/adminAddBranch", (req, res)=>{
    let DataSucursal = req.body;
    DB.query("SELECT nombre FROM sucursal WHERE nombre = ?", [DataSucursal.name], async (error, results)=>{
        if (error){
            console.log(error);
        }
        if(results.length>0){
            responses.PmessageErr = "Esta sucursal ya se encuentra en el sistema";
            responses.PmessageOK = "";
            res.redirect("/admin");
        }
        if(responses.PmessageErr===""){
            DB.query("INSERT INTO sucursal SET ?",{
                nombre:DataSucursal.name,
                ubicacion:DataSucursal.location,
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
    IsAuthenticated(req.session.user);
    res.render("contact", {Sesion:Sesion});
})

app.get("/tracking", function(req, res){
    IsAuthenticated(req.session.user);
    res.render("tracking", {Sesion:Sesion});
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

    DB.query("SELECT id,nombre, correo FROM usuarios WHERE nombre = ? OR correo = ?", [registerData.name, registerData.email], async (error, results)=>{
        if (error){
            console.log(error);
        }
        if(results.length>0){
            if(results[0].nombre){
                responses.messageErr = "El Nombre ya esta registrado.";
                responses.messageOK = "";
                res.redirect("/admin");
            }else{
                responses.messageErr = "El Correo ya esta registrado.";
                responses.messageOK = "";
                res.redirect("/admin");
            }
        }
        let hash = await bcrypt.hash(registerData.pass, 8);
        if(responses.messageErr===""){
            DB.query("INSERT INTO usuarios SET ?",{
                nombre:registerData.name,
                correo:registerData.email,
                clave:hash,
                idSucursal: registerData.optionSucursal,
                tipo_usuario:registerData.optionType,
                cargo:registerData.optionPos
            }, (err, results)=>{
                if(err) console.log(err)

                DB.query("INSERT INTO carrito SET ?",{idUsuario:results.insertId}, (err, results)=>{
                    console.log("hola");
                    if(err) console.log(err);
                    else{
                        responses.messageOK = "El registro fue creado satisfactoriamente.";
                        responses.messageErr = ""; 
                        res.redirect("/admin");
                    }
                })
            })
        }
    })
})

app.get("/SessionClose", (req,res)=>{
    req.session.destroy((err)=>{
        if(err) console.log(err);
        else {
            res.clearCookie('user');
            res.redirect("/home");
        }
    });

})
///////////////////////

app.listen(app.get("port"), function(){
    console.log("servidor iniciado");  
});

function handleDisconnect() {
    DB.query("select 1", (err) => {
        if(err) console.log(err);
        else {
            //console.log("DB reconectada");
            setTimeout(handleDisconnect, 3000)
        }
    });
}

function IsAuthenticated(data){
    if(typeof(data)!="undefined"){
        if(data.isAdmin){
            return data;
        }else{
            return data;
        }
    }else{
        Sesion=null;
    }
}

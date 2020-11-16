var responses = {
    messageErr:"",
    messageOK:"",
    PmessageErr:"",
    PmessageOK: "",
    CmessageOK:"",
}

var Sesion;

var express               = require("express"),
    app                   = express(),
    BodyParser            = require("body-parser"),
    FP                    = require("express-fileupload"),
    MethodOverride        = require("method-override"),
    flash                 = require("connect-flash"),
    bcrypt                = require("bcryptjs"),
    Sql                   = require("mysql"),
    NodeMailer            = require("nodemailer"),
    session               = require("express-session"),
    MySQLStore            = require("express-mysql-session")(session),
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

//Config de nodemailer//
let transporter = NodeMailer.createTransport({
    service: "gmail",
    auth: {
        user: "andresparedes202@gmail.com",
        pass: "rrclmyolimtffmqo"
    }
})
///////////////////////

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


//todo el codigo aqui//

app.get("/", function (_, res) { 
    res.redirect("/home");
})

app.get("/home",function(req, res){
    var ProductoData = []
    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
    }
    console.log(Sesion);
    DB.query("SELECT * FROM producto", (err, results)=>{
        if(err) console.log(err);
        else {
            ProductoData = results;
            res.render("index", {Sesion:Sesion,ProductoData:ProductoData,responses:responses});
            responses.CmessageOK="";
        }
    })
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
        if(err) {
            console.log(err);
            res.redirect("/home");
        } else {
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
        if(err) {
            console.log(err);
            res.redirect("/catalog");
        } else {
            if(results.length > 0){
                Producto = results;
                console.log(Producto);
                res.render("product", {Sesion:Sesion,Producto:Producto});
            } else {
                res.redirect("/catalog");
            }
        }
    })
})

app.get("/buy/:id", (req, res)=>{
    IsAuthenticated(req.session.user);
    var CartInfo= [];
    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
    } else{
        Sesion=null
        res.redirect("/login");
    }
    const id = req.params.id;

    DB.query("SELECT idProducto,cantidad,id FROM carrito_producto WHERE idUsuario = ?",[id], async (err, results)=>{
        if(err) console.log(err);
        else{
            if(results.length>0){
                for (let i in results) {
                    let query =  DB.query("SELECT * FROM producto WHERE id = ?", [results[i].idProducto])
                    query.on("result",(row)=> {
                        CartInfo[i] = {data:row, cantidad:results[i].cantidad, id:results[i].id, categoria:results[i].tipo_medicamento};
                    })
                    query.on("end", async()=>{
                        if(i==results.length-1){
                            let ubicacion;
                            let sucursal;
                            let query1 = DB.query(`SELECT sucursal.ubicacion,sucursal.nombre,sucursal.id 
                            FROM sucursal INNER JOIN usuarios
                            ON sucursal.id=usuarios.idSucursal
                            WHERE usuarios.id = ?`, [id]);
             
                            query1.on('result', async function(row, index) {
                                ubicacion=row.ubicacion;
                                sucursal = row.nombre;
                                idsucursal=row.id;
                                res.render("buy",{Sesion:Sesion, CartInfo:CartInfo, ubicacion:ubicacion, sucursal:sucursal,
                                idsucursal:idsucursal, responses:responses});
                                responses.messageErr="";
                                responses.messageOK=""; 
                            })
                            .on("error" ,function (error, index) {
                                console.log(error);
                            });
                        }
                    })
                }
            }else{
                res.render("buy",{Sesion:Sesion, Car:null});
            }
        }
    })

})

app.post("/login", function(req, res){
    loginData = req.body.data;
    let admin = false;
    DB.query("SELECT id, correo,tipo_usuario,clave from usuarios WHERE correo = ?", [loginData.email], async (error, results) => {
        if(error) console.log(error);
        if(results.length > 0) {
            await bcrypt.compare(loginData.pass, results[0].clave, function(err, result) {
                if(err) { 
                    console.log(err);
                    res.redirect("/login");
                }
                if(result) {

                    if(results[0].tipo_usuario==="admin") admin=true; 
                    
                    req.session.user = {
                        id: results[0].id,
                        nickname: results[0].correo,
                        isAuthed: true,
                        isAdmin: admin
                    };
                    console.log(admin);
                    res.redirect("/");
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
                    res.redirect("/home");
                }else{
                    contactoData=results;
                    DB.query("SELECT * FROM sucursal", (error, results)=>{
                        if(error){
                            console.log(error);
                            res.redirect("/home");
                        }else{
                            var sucursal = results;
                            console.log(sucursal);
                            DB.query("SELECT * FROM ganancias INNER JOIN sucursal ON ganancias.idSucursal=sucursal.id ORDER BY fecha DESC;", (error, results)=>{
                                if(error){
                                    console.log(error);
                                    res.redirect("/home");
                                }else{
                                    var earningsData = results;
                                    DB.query("SELECT usuarios.nombre, distribucion.* FROM distribucion INNER JOIN usuarios ON distribucion.idUsuario=usuarios.id;", (error, results)=>{
                                        if(error){
                                            console.log(error);
                                            res.redirect("/home");
                                        }else{
                                            var distributionData = results;
                                            res.render("admin", {responses:responses, contactoData:contactoData,Sesion:Sesion,sucursal:sucursal, earningsData:earningsData,distributionData:distributionData});
                                            responses.messageErr="";
                                            responses.messageOK="";
                                        }
                                    });
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
    var query;
    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
        if(Sesion.isAdmin){
            DB.query("SELECT * FROM producto WHERE id = ?", [id], async (error, results)=>{
                if (error){
                    console.log(error);
                } else{
                    if(DataProducto.notChange != undefined) {
                        query = {
                            nombre:DataProducto.name,
                            precio:DataProducto.price,
                            tipo_medicamento:DataProducto.type,
                            cantidad:DataProducto.quantity,
                            descripcion:DataProducto.description
                        }
                    } else {
                        var image = `./public/${results[0].IMG}`;
                        fs.unlink(image, function(err) {
                            if (err) {
                                console.log(err);
                            }
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
                            
                            query = {
                                nombre:DataProducto.name,
                                precio:DataProducto.price,
                                tipo_medicamento:DataProducto.type,
                                cantidad:DataProducto.quantity,
                                descripcion:DataProducto.description,
                                IMG:imgSource
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
                            
                        });
                    }
                    
                    
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
                            if(error.errno == 1217) {
                                responses.messageErr = "No se puede eliminar el producto ya que pertenece a una distribución";
                            } else {
                                responses.messageErr = "Ha ocurrido un error, inténtelo nuevamente";
                            }
                                console.log(error.errno)
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

app.get("/adminDeleteLog/:id", (req, res) =>{
    var id = req.params.id;
    console.log(`eliminando log ${id}`);

    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
        if(Sesion.isAdmin){
            DB.query("DELETE FROM contactoLog WHERE id = ?", [id], (error, results)=>{
                if(error){
                    console.log(error);
                    responses.messageErr = "Ha ocurrido un error, inténtelo nuevamente";
                    res.redirect("/admin");
                }else{
                    responses.messageOK = "La consulta ha sido eliminada de forma exitosa";
                    res.redirect("/admin");
                }
            });
        }else{
            res.redirect("/home");
        }
    }else{
        Sesion=null
        res.redirect("/home");
    }
})

app.get("/adminUsers", (req, res) => {
    var UserData = []
    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
        if(Sesion.isAdmin){
            DB.query(`SELECT sucursal.nombre sNombre, usuarios.nombre uNombre, usuarios.correo, usuarios.tipo_usuario, usuarios.cargo, usuarios.id
            FROM sucursal INNER JOIN usuarios
            ON sucursal.id=usuarios.idSucursal;`, (err, results)=>{
                if(err) console.log(err);
                else {
                    UserData = results;
                    console.log(UserData);
                    res.render("adminUsers", {Sesion:Sesion,UserData:UserData,responses:responses});
                    responses.messageErr="";
                    responses.messageOK="";
                }
            })
        } else {
            res.redirect("/home");
        }
    } else {
        Sesion = null; 
        res.redirect("/home");
    }
}) 

app.get("/adminEditUser/:id", (req, res) =>{
    console.log(`Editar ${req.params.id}`);
    var id = req.params.id;

    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
        if(Sesion.isAdmin){
            DB.query("SELECT * FROM usuarios WHERE id = ?", [id], async (error, results)=>{
                if (error){
                    console.log(error);
                } else{
                    var user = results[0];
                    console.log(user);
                    DB.query("SELECT * FROM sucursal", (error, results)=>{
                        if(error){
                            console.log(error);
                        }else{
                            var sucursal = results;
                            res.render("adminEditUser", {Sesion:Sesion, user:user, responses:responses, sucursal: sucursal});
                        }
                    });
                }
            });
        } else {
            res.redirect("/home");
        }
    } else {
        res.redirect("/home");
    }
})

app.post("/adminEditUser/:id", (req, res) => {
    var id = req.params.id;
    var DataUser = req.body.data;

    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
        if(Sesion.isAdmin){
            DB.query("SELECT id,nombre, correo FROM usuarios WHERE correo = ? AND NOT id = ?", [DataUser.correo, id], async (error, results)=>{
                if (error){
                    console.log(error);
                    responses.messageOK = "Ocurrió un error, inténtelo nuevamente.";
                    responses.messageErr = ""; 
                    res.redirect("/adminEditUsers");
                }
                if(results.length>0){
                    responses.messageErr = "El Correo ya está registrado.";
                    responses.messageOK = "";
                    res.redirect("/admin");
                }
                let hash = await bcrypt.hash(DataUser.pass, 8);
                if(responses.messageErr===""){
                    DB.query("UPDATE usuarios SET ? WHERE id = ?",[{
                        nombre:DataUser.name,
                        correo:DataUser.email,
                        clave:hash,
                        idSucursal: DataUser.optionSucursal,
                        tipo_usuario:DataUser.optionType,
                        cargo:DataUser.optionPos
                    }, id], (err, results)=>{
                        if(err) console.log(err)
                        else{
                            responses.messageOK = "El usuario fue actualizado satisfactoriamente.";
                            responses.messageErr = ""; 
                            res.redirect("/adminUsers");
                        }   
                    })
                }
            })
        } else {
            res.redirect("/home");
        }
    } else {
        res.redirect("/home");
    }
})

app.get("/adminDeleteUser/:id", (req, res) =>{
    var id = req.params.id;
    console.log(`eliminar ${id}`);

    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
        if(Sesion.isAdmin){
            
            DB.query(`DELETE FROM usuarios WHERE id = ?`, [id], (error, results)=>{
                if(error){
                    if(error.errno == 1217) {
                        responses.messageErr = "No se puede eliminar el usuario ya que tiene una distribución asociada";
                    } else {
                        responses.messageErr = "Ha ocurrido un error, inténtelo nuevamente";
                    }
                    console.log(error.errno)
                    res.redirect("/adminUsers");
                }else{
                    responses.messageOK = "El usuario ha sido eliminado de forma exitosa";
                    res.redirect("/adminUsers");
                }
            });
        } else{
            res.redirect("/home");
        }
    } else{
        Sesion=null
        res.redirect("/home");
    }
});

app.get("/adminBranches", (req, res) => {
    var BranchData = []
    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
        if(Sesion.isAdmin){
            DB.query("SELECT * FROM sucursal", (err, results)=>{
                if(err) console.log(err);
                else {
                    BranchData = results;
                    res.render("adminBranches", {Sesion:Sesion,BranchData:BranchData,responses:responses});
                    responses.messageErr="";
                    responses.messageOK="";
                }
            })
        } else {
            res.redirect("/home");
        }
    } else {
        Sesion = null; 
        res.redirect("/home");
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
                    console.log(result);
                    responses.messageOK = "El registro fue hecho satisfactoriamente.";
                    responses.messageErr = ""; 
                    res.redirect("/admin");
                }
            })
        }
    })
})

app.get("/adminEditBranch/:id", (req, res) =>{
    console.log(`Editar ${req.params.id}`);
    var id = req.params.id;

    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
        if(Sesion.isAdmin){
            DB.query("SELECT * FROM sucursal WHERE id = ?", [id], async (error, results)=>{
                if (error){
                    console.log(error);
                } else{
                    var sucursal = results[0];
                    console.log(sucursal);
                    res.render("adminEditBranch", {Sesion:Sesion, responses:responses, sucursal: sucursal});
                }
            });
        } else {
            res.redirect("/home");
        }
    } else {
        res.redirect("/home");
    }
})

app.post("/adminEditBranch/:id", (req, res) => {
    var id = req.params.id;
    var DataBranch = req.body.data;

    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
        if(Sesion.isAdmin){
            DB.query("UPDATE sucursal SET ? WHERE id = ?",[{
                nombre:DataBranch.name,
                ubicacion:DataBranch.location
            }, id], (err, results)=>{
                if(err) console.log(err)
                else{
                    responses.messageOK = "La sucursal fue actualizada satisfactoriamente.";
                    responses.messageErr = ""; 
                    res.redirect("/adminBranches");
                }   
            })
        } else {
            res.redirect("/home");
        }
    } else {
        res.redirect("/home");
    }
})

app.get("/adminDeleteBranch/:id", (req, res) =>{
    var id = req.params.id;
    console.log(`eliminar ${id}`);

    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
        if(Sesion.isAdmin){
            DB.query("DELETE FROM sucursal WHERE id = ?", [id], (error, results)=>{
                if(error){
                    if(error.errno == 1217) {
                        responses.messageErr = "No se puede eliminar la sucursal ya que posee usuarios o distribuciones asociadas";
                    } else {
                        responses.messageErr = "Ha ocurrido un error, inténtelo nuevamente";
                    }
                    console.log(error.errno);
                    res.redirect("/adminBranches");
                }else{
                    responses.messageOK = "La sucursal ha sido eliminado de forma exitosa";
                    res.redirect("/adminBranches");
                }
            });
        } else{
            res.redirect("/home");
        }
    } else{
        Sesion=null
        res.redirect("/home");
    }
});

app.get("/adminAprobeDis/:id", (req, res) => {
    var id = req.params.id;
    console.log(`aprobar ${id}`);

    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
        if(Sesion.isAdmin){
            DB.query("UPDATE distribucion SET estado='1' WHERE id = ?", [id], (error, results)=>{
                if(error){
                    if(error) {
                        responses.messageErr = "Ha ocurrido un error, inténtelo nuevamente";
                        console.log(error);
                        res.redirect("/admin");
                    }
                }else{
                    responses.messageOK = "La distribucion ha sido aprobada de forma exitosa";
                    res.redirect("/admin");
                }
            });
        } else{
            res.redirect("/home");
        }
    } else{
        Sesion=null
        res.redirect("/home");
    }
})

app.get("/adminDelDis/:id", (req, res) => {
    var id = req.params.id;
    console.log(`eliminar ${id}`);

    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
        if(Sesion.isAdmin){
            
            DB.query(`DELETE FROM distribucion WHERE id = ?`, [id], (error, results)=>{
                if(error){
                    if(error) {
                        responses.messageErr = "Ha ocurrido un error, inténtelo nuevamente";
                        console.log(error)
                        res.redirect("/admin");
                    }
                }else{
                    responses.messageOK = "La distribucion ha sido eliminada de forma exitosa";
                    res.redirect("/admin");
                }
            });
        } else{
            res.redirect("/home");
        }
    } else{
        Sesion=null
        res.redirect("/home");
    }
})

app.get("/contactanos", function(req, res){
    IsAuthenticated(req.session.user);
    res.render("contact", {Sesion:Sesion});
})

app.get("/estatus", function(req, res){
    var Distribution;
    var idSucursal= "";
    var nameSucursal= "";
    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
        const id = Sesion.id;
        DB.query("SELECT * FROM distribucion WHERE idUsuario = ?", [id] ,(err, results)=>{
            if(err){
                console.log(err);
                responses.messageErr="Hubo un error al entrar en los Estatus de las Distribuciones";
                res.redirect("/home");
            } 
            else {
                Distribution = results;
                idSucursal = results[0].idSucursal;
                console.log(results[0].idSucursal)
                DB.query("SELECT ubicacion FROM sucursal WHERE id = ?", [idSucursal], (err,results)=>{
                    if(err){
                        console.log(err);
                        responses.messageErr="Hubo un error al entrar en los Estatus de las Distribuciones";
                        res.redirect("/home");
                    }
                    else{
                        nameSucursal = results[0].ubicacion;
                        res.render("estatus", {Sesion:Sesion,responses:responses,Distribution:Distribution,nameSucursal:nameSucursal});
                    }
                })
            }
        })
    } else{
        Sesion=null
        res.redirect("/login");
    }
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
                else{
                    responses.messageOK = "El registro fue creado satisfactoriamente.";
                    responses.messageErr = ""; 
                    res.redirect("/admin");
                }   
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

app.post("/AddtoCart", (req, res)=>{
    let key;
    if(IsAuthenticated(req.session.user)!=null){
        Sesion=IsAuthenticated(req.session.user);
        console.log(Sesion);
    }else{
       res.redirect("/login");
    }
    console.log(req.body.ID);
    DB.query("SELECT cantidad FROM carrito_producto WHERE idProducto= ?",[req.body.ID], (err, results)=>{
        if(err){
            console.log(err);
            res.redirect("/home");
        }else{
            
            if(results.length<1){
                DB.query("SELECT id FROM usuarios WHERE correo= ?", [Sesion.nickname], (err,results1)=>{
                    if(err){
                        console.log(err);
                    } 
                    else{
                        DB.query("INSERT INTO carrito_producto SET ?",{idProducto:req.body.ID,idUsuario:results1[0].id,cantidad:Number(req.body.cantidad)}, (err, results)=>{
                            if(err){
                                console.log(err);
                            }
                            else{
                                res.redirect("/catalog");
                            }
                        })    
                    }
                })
            }else{
                key = Number(results[0].cantidad)+Number(req.body.cantidad);
                DB.query("UPDATE carrito_producto SET ? WHERE idProducto = ?",[{cantidad:key}, req.body.ID], (err, result)=>{
                    if(err){
                        console.log(err);
                        res.redirect("/home");
                    }else{
                        res.redirect("/catalog");
                    }
                })
            }
        }
    })


})

app.post("/UpdateCart", (req,res)=>{
    DB.query("UPDATE carrito_producto SET ? WHERE id = ?", [{
        idProducto:req.body.idProducto, 
        idUsuario:req.body.UsrId, 
        cantidad:req.body.cantidad},
        req.body.id], (err, results)=>{
            if(err) console.log(err);
            else res.redirect(`UserCart/${req.body.UsrId}`);
    })
})

app.post("/DeleteFromCart", (req,res)=>{
    console.log(req.body.id);
    DB.query("DELETE FROM carrito_producto WHERE id = ?", [req.body.id], (err, results)=>{
        if(err) console.log(err);
        else res.redirect(`/UserCart/${req.body.UsrId}`);
    });
})

app.get("/UserCart/:id", async (req, res)=>{
    let CartInfo = [];
    if(IsAuthenticated(req.session.user)!=null){
        Sesion= IsAuthenticated(req.session.user)
    }else{
        res.redirect("/login");
    }
    const id = req.params.id;

    DB.query("SELECT idProducto,cantidad,id FROM carrito_producto WHERE idUsuario = ?",[id], async (err, results)=>{
        if(err) console.log(err);
        else{
            if(results.length>0){
                for (let i in results) {
                    let query =  DB.query("SELECT * FROM producto WHERE id = ?", [results[i].idProducto])
                    query.on("result",(row)=> {
                        CartInfo[i] = {data:row, cantidad:results[i].cantidad, id:results[i].id, categoria:results[i].tipo_medicamento};
                    })
                    query.on("end",()=>{
                        if(i==results.length-1){
                            let ubicacion;
                            let query1 = DB.query(`SELECT sucursal.ubicacion
                            FROM sucursal INNER JOIN usuarios
                            ON sucursal.id=usuarios.idSucursal
                            WHERE usuarios.id = ?`, [id]);
             
                                query1.on('result', function(row, index) {
                                    ubicacion=row.ubicacion;
                                    res.render("Cart",{Sesion:Sesion, CartInfo:CartInfo, ubicacion:ubicacion});
                                })
                                .on("error" ,function (error, index) {
                                    console.log(error);
                                });
                        }
                    })
                }
            }else{
                res.render("Cart",{Sesion:Sesion, CartInfo:null, ubicacion:null});
            }
        }
    })
})

app.post("/Checkout", (req, res)=>{
    DB.query("SELECT * FROM carrito_producto WHERE idUsuario = ?",[req.session.user.id], (err, resultsCart)=>{
        if(err){
            console.log(err);
            res.redirect("/buy/"+Sesion.id);
            responses.CmessageOK=false;
        }
        else{
            DB.query("INSERT INTO distribucion SET ?",[
                {idUsuario:req.session.user.id,
                    idSucursal:Number(req.body.idsucursal),
                    origen:"Sigmar",
                    destino:req.body.sucursal,
                    fecha_salida:req.body.Fsalida,
                    fecha_entrega:req.body.Fentrega,
                    direccion: req.body.address,
                    total: req.body.subtotal,
                    estado: false,
                    referencia: req.body.referencia
                }], (err, resultsDist)=>{
                    if(err){
                        console.log(err);
                        res.redirect("/buy/"+Sesion.id);
                        responses.CmessageOK=false;
                    } 
                    else{
                        for (let i in resultsCart) {
                            DB.query("INSERT INTO productos_distribucion SET ?",[{idProductos:resultsCart[i].idProducto, idDistribucion:resultsDist.insertId, cantidad:resultsCart[i].cantidad}], (err, results)=>{
                                if(err){
                                    console.log(err);
                                    res.redirect("/buy/"+Sesion.id);
                                    responses.CmessageOK=false;
                                }else{
                                    if(i==(resultsCart.length-1)){
                                        DB.query("DELETE FROM carrito_producto WHERE idUsuario = ? ",[Sesion.id], (err,resullts)=>{
                                            if(err){
                                                console.log(err);
                                                res.redirect("/buy/"+Sesion.id);
                                                responses.CmessageOK=false;
                                            }else{
                                                transporter.sendMail({
                                                    from: '"Sigma"andresparedes202@gmail.com', // sender address
                                                    to: Sesion.nickname, // list of receivers
                                                    subject: "Su pedido esta siendo procesado", // Subject line
                                                    html:`
                                                    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                                                
                                                <html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
                                                <head>
                                                <!--[if gte mso 9]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
                                                <meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
                                                <meta content="width=device-width" name="viewport"/>
                                                <!--[if !mso]><!-->
                                                <meta content="IE=edge" http-equiv="X-UA-Compatible"/>
                                                <!--<![endif]-->
                                                <title></title>
                                                <!--[if !mso]><!-->
                                                <!--<![endif]-->
                                                <style type="text/css">
                                                        body {
                                                            margin: 0;
                                                            padding: 0;
                                                        }
                                                
                                                        table,
                                                        td,
                                                        tr {
                                                            vertical-align: top;
                                                            border-collapse: collapse;
                                                        }
                                                
                                                        * {
                                                            line-height: inherit;
                                                        }
                                                
                                                        a[x-apple-data-detectors=true] {
                                                            color: inherit !important;
                                                            text-decoration: none !important;
                                                        }
                                                    </style>
                                                <style id="media-query" type="text/css">
                                                        @media (max-width: 655px) {
                                                
                                                            .block-grid,
                                                            .col {
                                                                min-width: 320px !important;
                                                                max-width: 100% !important;
                                                                display: block !important;
                                                            }
                                                
                                                            .block-grid {
                                                                width: 100% !important;
                                                            }
                                                
                                                            .col {
                                                                width: 100% !important;
                                                            }
                                                
                                                            .col>div {
                                                                margin: 0 auto;
                                                            }
                                                
                                                            img.fullwidth,
                                                            img.fullwidthOnMobile {
                                                                max-width: 100% !important;
                                                            }
                                                
                                                            .no-stack .col {
                                                                min-width: 0 !important;
                                                                display: table-cell !important;
                                                            }
                                                
                                                            .no-stack.two-up .col {
                                                                width: 50% !important;
                                                            }
                                                
                                                            .no-stack .col.num4 {
                                                                width: 33% !important;
                                                            }
                                                
                                                            .no-stack .col.num8 {
                                                                width: 66% !important;
                                                            }
                                                
                                                            .no-stack .col.num4 {
                                                                width: 33% !important;
                                                            }
                                                
                                                            .no-stack .col.num3 {
                                                                width: 25% !important;
                                                            }
                                                
                                                            .no-stack .col.num6 {
                                                                width: 50% !important;
                                                            }
                                                
                                                            .no-stack .col.num9 {
                                                                width: 75% !important;
                                                            }
                                                
                                                            .video-block {
                                                                max-width: none !important;
                                                            }
                                                
                                                            .mobile_hide {
                                                                min-height: 0px;
                                                                max-height: 0px;
                                                                max-width: 0px;
                                                                display: none;
                                                                overflow: hidden;
                                                                font-size: 0px;
                                                            }
                                                
                                                            .desktop_hide {
                                                                display: block !important;
                                                                max-height: none !important;
                                                            }
                                                        }
                                                    </style>
                                                </head>
                                                <body class="clean-body" style="margin: 0; padding: 0; -webkit-text-size-adjust: 100%; background-color: #f1f4f8;">
                                                <!--[if IE]><div class="ie-browser"><![endif]-->
                                                <table bgcolor="#f1f4f8" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="table-layout: fixed; vertical-align: top; min-width: 320px; Margin: 0 auto; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f1f4f8; width: 100%;" valign="top" width="100%">
                                                <tbody>
                                                <tr style="vertical-align: top;" valign="top">
                                                <td style="word-break: break-word; vertical-align: top;" valign="top">
                                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color:#f1f4f8"><![endif]-->
                                                <div style="background-color:transparent;">
                                                <div class="block-grid" style="Margin: 0 auto; min-width: 320px; max-width: 635px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; background-color: transparent;">
                                                <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
                                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:635px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
                                                <!--[if (mso)|(IE)]><td align="center" width="635" style="background-color:transparent;width:635px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:0px; padding-bottom:0px;"><![endif]-->
                                                <div class="col num12" style="min-width: 320px; max-width: 635px; display: table-cell; vertical-align: top; width: 635px;">
                                                <div style="width:100% !important;">
                                                <!--[if (!mso)&(!IE)]><!-->
                                                <div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:0px; padding-bottom:0px; padding-right: 0px; padding-left: 0px;">
                                                <!--<![endif]-->
                                                <div class="mobile_hide">
                                                <table border="0" cellpadding="0" cellspacing="0" class="divider" role="presentation" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" valign="top" width="100%">
                                                <tbody>
                                                <tr style="vertical-align: top;" valign="top">
                                                <td class="divider_inner" style="word-break: break-word; vertical-align: top; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; padding-top: 30px; padding-right: 10px; padding-bottom: 0px; padding-left: 10px;" valign="top">
                                                <table align="center" border="0" cellpadding="0" cellspacing="0" class="divider_content" role="presentation" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-top: 0px solid #BBBBBB; width: 100%;" valign="top" width="100%">
                                                <tbody>
                                                <tr style="vertical-align: top;" valign="top">
                                                <td style="word-break: break-word; vertical-align: top; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" valign="top"><span></span></td>
                                                </tr>
                                                </tbody>
                                                </table>
                                                </td>
                                                </tr>
                                                </tbody>
                                                </table>
                                                </div>
                                                <!--[if (!mso)&(!IE)]><!-->
                                                </div>
                                                <!--<![endif]-->
                                                </div>
                                                </div>
                                                <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
                                                <!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
                                                </div>
                                                </div>
                                                </div>
                                                <div style="background-color:transparent;">
                                                <div class="block-grid" style="Margin: 0 auto; min-width: 320px; max-width: 635px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; background-color: #ffffff;">
                                                <div style="border-collapse: collapse;display: table;width: 100%;background-color:#ffffff;">
                                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:635px"><tr class="layout-full-width" style="background-color:#ffffff"><![endif]-->
                                                <!--[if (mso)|(IE)]><td align="center" width="635" style="background-color:#ffffff;width:635px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 1px solid #F3F2F3; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:0px; padding-bottom:0px;"><![endif]-->
                                                <div class="col num12" style="min-width: 320px; max-width: 635px; display: table-cell; vertical-align: top; width: 635px;">
                                                <div style="width:100% !important;">
                                                <!--[if (!mso)&(!IE)]><!-->
                                                <div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:1px solid #F3F2F3; border-right:0px solid transparent; padding-top:0px; padding-bottom:0px; padding-right: 0px; padding-left: 0px;">
                                                <!--<![endif]-->
                                                <table border="0" cellpadding="0" cellspacing="0" class="divider" role="presentation" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" valign="top" width="100%">
                                                <tbody>
                                                <tr style="vertical-align: top;" valign="top">
                                                <td class="divider_inner" style="word-break: break-word; vertical-align: top; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; padding-top: 15px; padding-right: 10px; padding-bottom: 0px; padding-left: 10px;" valign="top">
                                                <table align="center" border="0" cellpadding="0" cellspacing="0" class="divider_content" role="presentation" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-top: 0px solid #BBBBBB; width: 100%;" valign="top" width="100%">
                                                <tbody>
                                                <tr style="vertical-align: top;" valign="top">
                                                <td style="word-break: break-word; vertical-align: top; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" valign="top"><span></span></td>
                                                </tr>
                                                </tbody>
                                                </table>
                                                </td>
                                                </tr>
                                                </tbody>
                                                </table>
                                                <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Verdana, sans-serif"><![endif]-->
                                                <div style="color:#ff8754;font-family:Verdana, Geneva, sans-serif;line-height:1.2;padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;">
                                                <div style="line-height: 1.2; font-size: 12px; font-family: Verdana, Geneva, sans-serif; color: #000000; mso-line-height-alt: 14px;">
                                                <p style="line-height: 1.2; text-align: center; font-family: Verdana, Geneva, sans-serif; word-break: break-word; mso-line-height-alt: 14px; margin: 0;"><span style="background-color: #ffffff;"><strong><span style="font-size: 46px; background-color: #ffffff;"><img src="cid:sigmalogo">Sigma</p>
                                                </div>
                                                </div>
                                                <!--[if mso]></td></tr></table><![endif]-->
                                                <!--[if (!mso)&(!IE)]><!-->
                                                </div>
                                                <!--<![endif]-->
                                                </div>
                                                </div>
                                                <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
                                                <!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
                                                </div>
                                                </div>
                                                </div>
                                                <div style="background-color:transparent;">
                                                <div class="block-grid" style="Margin: 0 auto; min-width: 320px; max-width: 635px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; background-color: #ffffff;">
                                                <div style="border-collapse: collapse;display: table;width: 100%;background-color:#ffffff;">
                                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:635px"><tr class="layout-full-width" style="background-color:#ffffff"><![endif]-->
                                                <!--[if (mso)|(IE)]><td align="center" width="635" style="background-color:#ffffff;width:635px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:0px; padding-bottom:0px;"><![endif]-->
                                                <div class="col num12" style="min-width: 320px; max-width: 635px; display: table-cell; vertical-align: top; width: 635px;">
                                                <div style="width:100% !important;">
                                                <!--[if (!mso)&(!IE)]><!-->
                                                <div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:0px; padding-bottom:0px; padding-right: 0px; padding-left: 0px;">
                                                <!--<![endif]-->
                                                <div align="center" class="img-container center autowidth" style="padding-right: 0px;padding-left: 0px;">
                                                <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr style="line-height:0px"><td style="padding-right: 0px;padding-left: 0px;" align="center"><![endif]--><img align="center" alt="I'm an image" border="0" class="center autowidth" src="cid:thanksimg" style="text-decoration: none; -ms-interpolation-mode: bicubic; height: auto; border: 0; width: 100%; max-width: 635px; display: block;" title="I'm an image" width="635"/>
                                                <!--[if mso]></td></tr></table><![endif]-->
                                                </div>
                                                <table border="0" cellpadding="0" cellspacing="0" class="divider" role="presentation" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" valign="top" width="100%">
                                                <tbody>
                                                <tr style="vertical-align: top;" valign="top">
                                                <td class="divider_inner" style="word-break: break-word; vertical-align: top; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; padding-top: 10px; padding-right: 10px; padding-bottom: 10px; padding-left: 10px;" valign="top">
                                                <table align="center" border="0" cellpadding="0" cellspacing="0" class="divider_content" role="presentation" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-top: 0px solid #BBBBBB; width: 100%;" valign="top" width="100%">
                                                <tbody>
                                                <tr style="vertical-align: top;" valign="top">
                                                <td style="word-break: break-word; vertical-align: top; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" valign="top"><span></span></td>
                                                </tr>
                                                </tbody>
                                                </table>
                                                </td>
                                                </tr>
                                                </tbody>
                                                </table>
                                                <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 40px; padding-left: 40px; padding-top: 20px; padding-bottom: 15px; font-family: Tahoma, sans-serif"><![endif]-->
                                                <div style="color:#555555;font-family:Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;line-height:1.2;padding-top:20px;padding-right:40px;padding-bottom:15px;padding-left:40px;">
                                                <div style="line-height: 1.2; font-size: 12px; color: #555555; font-family: Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif; mso-line-height-alt: 14px;">
                                                <p style="font-size: 46px; line-height: 1.2; text-align: center; word-break: break-word; mso-line-height-alt: 55px; margin: 0;"><span style="font-size: 46px; color: #003188;"><strong></%Usr.nombre.split("")[0]%>tu pago esta siendo procesado</strong></span></p>
                                                </div>
                                                </div>
                                                <!--[if mso]></td></tr></table><![endif]-->
                                                <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 40px; padding-left: 40px; padding-top: 15px; padding-bottom: 10px; font-family: Tahoma, sans-serif"><![endif]-->
                                                <div style="color:#555555;font-family:Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;line-height:1.5;padding-top:15px;padding-right:40px;padding-bottom:10px;padding-left:40px;">
                                                <div style="line-height: 1.5; font-size: 12px; font-family: Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif; color: #555555; mso-line-height-alt: 18px;">
                                                <p style="line-height: 1.5; word-break: break-word; font-family: Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif; font-size: 16px; mso-line-height-alt: 24px; margin: 0;"><span style="font-size: 16px; color: #6d89bc;">Una vez tu pago sea procesado, recibirás tu producto en un rango de tiempo de 72h. </span></p>
                                                <p style="line-height: 1.5; word-break: break-word; font-family: Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif; font-size: 16px; mso-line-height-alt: 24px; margin: 0;"><span style="font-size: 16px; color: #6d89bc;">Esperamos por tu próxima compra</span></p>
                                                </div>
                                                </div>
                                                <!--[if mso]></td></tr></table><![endif]-->
                                                <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 40px; padding-left: 40px; padding-top: 20px; padding-bottom: 10px; font-family: Tahoma, sans-serif"><![endif]-->
                                                <div style="color:#555555;font-family:Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;line-height:1.5;padding-top:20px;padding-right:40px;padding-bottom:10px;padding-left:40px;">
                                                <div style="line-height: 1.5; font-size: 12px; font-family: Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif; color: #555555; mso-line-height-alt: 18px;">
                                                <p style="line-height: 1.5; word-break: break-word; font-family: Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif; font-size: 16px; mso-line-height-alt: 24px; margin: 0;"><span style="font-size: 16px; color: #6d89bc;">Saludos,</span></p>
                                                <p style="line-height: 1.5; word-break: break-word; font-family: Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif; font-size: 16px; mso-line-height-alt: 24px; margin: 0;"><span style="font-size: 16px; color: #6d89bc;">Andres Paredes- CEO</span></p>
                                                <p style="line-height: 1.5; word-break: break-word; font-family: Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif; mso-line-height-alt: 18px; margin: 0;"> </p>
                                                </div>
                                                </div>
                                                <!--[if mso]></td></tr></table><![endif]-->
                                                <!--[if (!mso)&(!IE)]><!-->
                                                </div>
                                                <!--<![endif]-->
                                                </div>
                                                </div>
                                                <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
                                                <!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
                                                </div>
                                                </div>
                                                </div>
                                                <div style="background-color:transparent;">
                                                <div class="block-grid" style="Margin: 0 auto; min-width: 320px; max-width: 635px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; background-color: transparent;">
                                                <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
                                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:635px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
                                                <!--[if (mso)|(IE)]><td align="center" width="635" style="background-color:transparent;width:635px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:0px; padding-bottom:0px;"><![endif]-->
                                                <div class="col num12" style="min-width: 320px; max-width: 635px; display: table-cell; vertical-align: top; width: 635px;">
                                                <div style="width:100% !important;">
                                                <!--[if (!mso)&(!IE)]><!-->
                                                <div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:0px; padding-bottom:0px; padding-right: 0px; padding-left: 0px;">
                                                <!--<![endif]-->
                                                <div class="mobile_hide">
                                                <table border="0" cellpadding="0" cellspacing="0" class="divider" role="presentation" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" valign="top" width="100%">
                                                <tbody>
                                                <tr style="vertical-align: top;" valign="top">
                                                <td class="divider_inner" style="word-break: break-word; vertical-align: top; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; padding-top: 30px; padding-right: 10px; padding-bottom: 0px; padding-left: 10px;" valign="top">
                                                <table align="center" border="0" cellpadding="0" cellspacing="0" class="divider_content" role="presentation" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-top: 0px solid #BBBBBB; width: 100%;" valign="top" width="100%">
                                                <tbody>
                                                <tr style="vertical-align: top;" valign="top">
                                                <td style="word-break: break-word; vertical-align: top; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" valign="top"><span></span></td>
                                                </tr>
                                                </tbody>
                                                </table>
                                                </td>
                                                </tr>
                                                </tbody>
                                                </table>
                                                </div>
                                                <!--[if (!mso)&(!IE)]><!-->
                                                </div>
                                                <!--<![endif]-->
                                                </div>
                                                </div>
                                                <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
                                                <!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
                                                </div>
                                                </div>
                                                </div>
                                                <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
                                                </td>
                                                </tr>
                                                </tbody>
                                                </table>
                                                <!--[if (IE)]></div><![endif]-->
                                                </body>
                                                </html>
                                                
                                                    `,
                                                    attachments:[
                                                        {
                                                            path: "public/Images/Welcome_Email.png",
                                                            cid: "thanksimg"

                                                        },{
                                                            path:"public/Images/BigLogo.png",
                                                            cid:"sigmalogo"
                                                        }
                                                    ]
                                                    },function(err, data){
                                                        if(err) console.log(err);
                                                        else  console.log("email enviado");
                                                    });
                                                    
                                                    for (let i in resultsCart) {
                                                        DB.query("SELECT cantidad FROM producto WHERE id=?",[resultsCart[i].idProducto],(err, resultsFQ)=>{
                                                            if(err) console.log(err);
                                                            else{
                                                                let Ncantidad = Number(resultsFQ[0].cantidad)-Number(resultsCart[i].cantidad);
                                                                console.log(Ncantidad);
                                                                DB.query("UPDATE producto SET ? WHERE id= ?",[{cantidad:Ncantidad},resultsCart[i].idProducto],(err,results)=>{
                                                                    if(err) console.log(err);
                                                                })
                                                            }
                                                        })
                                                    }

                                                    // DB.query("INSERT INTO ganancias SET ?", [], (err,results)=>{
                                                    //     if(err) console.log(err);
                                                    //     else{

                                                    //     }
                                                    // })
                                                responses.CmessageOK=true;
                                                
                                                res.redirect("/home");

                                            }
                                        })
                                    }
                                }
                            }) 
                        }
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
    DB.query("select 1", (err) => {
        if(err) console.log(err);
        else {
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

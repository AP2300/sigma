var EstadosUSA = ["Alabama","Alaska","American Samoa","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","District Of Columbia","Federated States Of Micronesia","Florida",
                "Georgia","Guam","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Marshall Islands","Maryland","Massachusetts","Michigan","Minnesota","Mississippi",
                "Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Northern Mariana Islands","Ohio","Oklahoma","Oregon","Palau",
                "Pennsylvania","Puerto Rico","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virgin Islands","Virginia","Washington","West Virginia","Wisconsin","Wyoming"]

var EstadosVEN = ["Amazonas","Anzoategui","Apure","Aragua","Barinas","Bolivar","Carabobo","Cojedes","Delta Amacuro","Distrito Capital","Falcon","Guarico","Lara","Merida","Miranda","Monagas",
                "Nueva Esparta","Portuguesa","Sucre","Tachira","Trujillo","Vargas","Yacuray","Zulia"]

$(document).ready(function(){
    $("#UsersPanel").collapse("hide")
    $("#ProductsPanel").collapse("hide")
    $("#OtrosPanel").collapse("hide")
    $("#SucursalPanel").collapse("hide")
    $("#DisPanel").collapse("hide")
    $("#EarningsPanel").collapse("hide")

    $("#Productos").click(function () { 
        $("#UsersPanel").collapse("hide")
        $("#OtrosPanel").collapse("hide")
        $("#SucursalPanel").collapse("hide")
        $("#DisPanel").collapse("hide")
        $("#EarningsPanel").collapse("hide")
        document.getElementById("textSelection").innerHTML="Administre los productos";
    });
    $("#Users").click(function () { 
        $("#ProductsPanel").collapse("hide")
        $("#SucursalPanel").collapse("hide")
        $("#OtrosPanel").collapse("hide")
        $("#DisPanel").collapse("hide")
        $("#EarningsPanel").collapse("hide")
        document.getElementById("textSelection").innerHTML="Administre los usuarios";
    });
    $("#Admins").click(function () { 
        $("#UsersPanel").collapse("hide")
        $("#ProductsPanel").collapse("hide")
        $("#SucursalPanel").collapse("hide")
        $("#DisPanel").collapse("hide")
        $("#EarningsPanel").collapse("hide")
        document.getElementById("textSelection").innerHTML="Administre las consultas";
    });
    $("#Sucursal").click(function () { 
        $("#UsersPanel").collapse("hide")
        $("#ProductsPanel").collapse("hide")
        $("#OtrosPanel").collapse("hide")
        $("#DisPanel").collapse("hide")
        $("#EarningsPanel").collapse("hide")
        document.getElementById("textSelection").innerHTML="Administre las sucursales";
    });
    $("#Distribution").click(function () { 
        $("#ProductsPanel").collapse("hide")
        $("#UsersPanel").collapse("hide")
        $("#OtrosPanel").collapse("hide")
        $("#SucursalPanel").collapse("hide")
        $("#EarningsPanel").collapse("hide")
        document.getElementById("textSelection").innerHTML="Administre las distribuciones";
    });
    $("#Earning").click(function () { 
        $("#ProductsPanel").collapse("hide")
        $("#UsersPanel").collapse("hide")
        $("#OtrosPanel").collapse("hide")
        $("#SucursalPanel").collapse("hide")
        $("#DisPanel").collapse("hide")
        document.getElementById("textSelection").innerHTML="Observe las ganancias";
    });
});

if ($(".alert-dismissible").length) {
    $("#UsersPanel").collapse("show");
}

$('#CustomFile').on('change',function(){
    //get the file name
    var fileName = $(this).val();
    var cleanFileName = fileName.replace('C:\\fakepath\\', " ");
    //replace the "Choose a file" label
    $(this).next('.custom-file-label').html(cleanFileName);
})

var filter="";
function buscar(Data, filter, isAdmin){
    let text = document.getElementById("Busqueda").value.toLowerCase();
    text.replace(/[-[\]{}()*+?.,\\^$|#]/g, "\\$&");
    console.log(text);
    let reg = new RegExp(`\\b${text}`, 'i');
    let html = "";

    console.log(Data);
    

    for(let producto of Data){
        if(reg.test(producto.nombre)&&producto.tipo_medicamento===filter||reg.test(producto.nombre)&&filter==="Todos"
        ||reg.test(producto.nombre)&&filter===""){
            console.log(filter);
            console.log(producto.id, producto.nombre);
            html+=`
            <div class="col mb-4">
                <a class="product" onclick="redirect(${producto.id})" style="cursor: pointer">
                    <div class="card card-producto h-100">
                        <img src="${producto.IMG}" class="card-img-top" >
                        <div class="card-body">
                            <h5 class="card-title">${producto.nombre}</h5>
                            <p class="card-text">Tipo de Medicamento: ${producto.tipo_medicamento}</p>
                        </div>
                        <div class="card-footer" id="catalogPage">
                            <small class="text-muted">Precio: ${producto.precio}$</small>`
                            if(isAdmin==true) {
                                html += `<br>
                                <span class="btn btn-alert mt-2" role="button" id="edit" onclick="editarProducto(${producto.id})"><i class="far fa-edit"></i></span>
                                <span class="btn mt-2" type="" onclick="borrarProducto(${producto.id})" id="boton"><i class="far fa-trash-alt"></i></span>
                        </div>
                    </div>
                </a>
            </div>`}
                            else {html += `
                        </div>
                    </div>
                </a>
            </div>`}
        }
    }
    console.log(isAdmin)
    document.getElementById("productos").innerHTML=html;
}

function editarProducto(id) {
    window.location.href = `/adminEditProduct/${id}`;
}

function redirect(id) {
    window.location.href = `/product/${id}`;
}

$(document).ready(function(){
    $("#boton").click(function(event) {
        event.stopPropagation();
    })
    $("#edit").click(function(event) {
        event.stopPropagation();
    })
})

function borrarlog(id) {
    var res = confirm("Está seguro de que desea eliminar el producto?");

    if(res) {
        console.log(`eliminado ${id}`);
        window.location.href = `/adminDeleteLog/${id}`;
    }
}

function borrarProducto(id) {
    var res = confirm("Está seguro de que desea eliminar el producto?");

    if(res) {
        console.log(`eliminado ${id}`);
        window.location.href = `/adminDeleteProduct/${id}`;
    }
}

function editarUsuario(id) {
    window.location.href = `/adminEditUser/${id}`;
}

function borrarUsuario(id) {
    var res = confirm("Está seguro de que desea eliminar el usuario?");

    if(res) {
        console.log(`eliminado ${id}`);
        window.location.href = `/adminDeleteUser/${id}`;
    }
}

function borrarSucursal(id) {
    var res = confirm("Está seguro de que desea eliminar la sucursal?");

    if(res) {
        console.log(`eliminado ${id}`);
        window.location.href = `/adminDeleteBranch/${id}`;
    }
}

function handleChange(obj) {
    if(obj.checked == true){
        document.getElementById("CustomFile").setAttribute("disabled", "disabled");
    }else{
        document.getElementById("CustomFile").removeAttribute("disabled");
   }
}

$("ol").on("click","li", function (){
    var cat=$(this).text();
    filter=cat;
    $(".breadcrumb-item").removeClass("activo");
    $(this).toggleClass("activo");
    buscar(SearchData,filter,isAdmin);
})

if(window.location.pathname === "/catalog") buscar(SearchData,filter,isAdmin);

function AddToCart() {  
    document.getElementById("qtty").submit();
}

var Value;
function calculate(){
    let qtty = document.getElementById("InputQtty").value;
    let Total = Value*qtty;
    document.getElementById("Total").innerText=Total;
}

function estados() {
    let html = `<option selected disabled value="">Elegir...</option>`
    
    let Name = document.getElementById("PaisSelect").value;

    if(Name === 'Estados Unidos'){
        EstadosUSA.forEach(el => {
            html+=`<option>${el}</option>`
        });
    } else if (Name === 'Venezuela'){
        EstadosVEN.forEach(el => {
            html+=`<option>${el}</option>`
        });
    }

    document.getElementById("Estados").innerHTML = html;
}

function selectuser(){
    let user = document.getElementById("SelectUser").value;

    if(user === "client"){
        document.getElementById("SelectJob").value = "null";
    }
}

function SubmitCartForm(data){
    document.getElementById(data).submit();
}

function SubmitDelete(data){
    document.getElementById(data).submit();
}
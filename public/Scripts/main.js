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
                <a class="product" href="/product/${producto.id}">
                    <div class="card card-producto h-100">
                        <img src="${producto.IMG}" class="card-img-top" >
                        <div class="card-body">
                            <h5 class="card-title">${producto.nombre}</h5>
                            <p class="card-text">Tipo de Medicamento: ${producto.tipo_medicamento}</p>
                        </div>
                        <div class="card-footer" id="catalogPage">
                            <small class="text-muted">Precio: ${producto.precio}$</small>`
                            if(isAdmin==true) {
                                html += `<br><form class="mt-2 mb-2 d-inline-block" action="/adminEditProduct/${producto.id}" method="GET" enctype="multipart/form-data">
                                <button type="submit" class="btn btn-alert">Editar</button>
                            </form>
                            <a href="javascript: void(0)">
                                <button type="button" class="btn btn-danger d-inline-block" onclick="borrarProducto(${producto.id})">Eliminar</button>
                            </a>
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

function borrarProducto(id) {
    var res = confirm("Está seguro de que desea eliminar el producto?");

    if(res) {
        console.log(`eliminado ${id}`);
        window.location.href = `/adminDeleteProduct/${id}`;
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
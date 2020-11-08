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
function buscar(Data, filter){
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
                        <div class="card-footer">
                            <small class="text-muted">Precio: ${producto.precio}$</small>
                        </div>
                    </div>
                </a>
            </div>`
        }
    }
    document.getElementById("productos").innerHTML=html;
}

$("ol").on("click","li", function (){
    var cat=$(this).text();
    filter=cat;
    $(".breadcrumb-item").removeClass("activo");
    $(this).toggleClass("activo");
    buscar(SearchData,filter);
})

if(window.location.pathname === "/catalog") buscar(SearchData,filter);


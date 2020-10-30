$("#Productos").click(function () { 
    $("#UsersPanel").collapse("hide")
    $("#OtrosPanel").collapse("hide")
});
$("#Users").click(function () { 
    $("#ProductsPanel").collapse("hide")
    $("#OtrosPanel").collapse("hide")
});
$("#Admins").click(function () { 
    $("#UsersPanel").collapse("hide")
    $("#ProductsPanel").collapse("hide")
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

function buscar(Data){
    let text = document.getElementById("Busqueda").value.toLowerCase();
    text.replace(/[-[\]{}()*+?.,\\^$|#]/g, "\\$&");
    console.log(text);
    let reg = new RegExp(`\\b${text}`, 'i');
    let html = "";

    for(let producto of Data){
		if(reg.test(producto.nombre)){
            html+=`
            <div class="col mb-4">
                <div class="card">
                    <img src="${producto.IMG}" class="card-img-top" >
                    <div class="card-body">
                        <h5 class="card-title">${producto.nombre}</h5>
                        <p class="card-text">Tipo de Medicamento: ${producto.tipo_medicamento}</p>
                    </div>
                    <div class="card-footer">
                        <small class="text-muted">Precio: ${producto.precio}$</small>
                    </div>
                </div>
            </div>`
        }
        else if(reg.test("")){
            html+=`
            <div class="col mb-4">
                <div class="card">
                    <img src="${producto.IMG}" class="card-img-top" >
                    <div class="card-body">
                        <h5 class="card-title">${producto.nombre}</h5>
                        <p class="card-text">Tipo de Medicamento: ${producto.tipo_medicamento}</p>
                    </div>
                    <div class="card-footer">
                        <small class="text-muted">Precio: ${producto.precio}$</small>
                    </div>
                </div>
            </div>`
        }
    }
    document.getElementById("productos").innerHTML=html;
}
    if(window.location.pathname === "/catalog") buscar(SearchData);
    
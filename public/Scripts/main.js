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
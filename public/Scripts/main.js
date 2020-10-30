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
console.log(SearchData);
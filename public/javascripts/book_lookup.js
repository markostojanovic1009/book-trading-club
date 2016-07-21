$(document).ready(function(){
    $("#book-find").click(function(){
       var title = $("#title").val();
        var query = "http://openlibrary.org/search.json?title=" + encodeURIComponent(title);
        console.log(query);
        $.getJSON(query, function(data) {
            console.log(data);
           var results = data.docs;
            results = results.filter(function(element) {
               return element.cover_i != null;
            });
            for(var i = 0; i < results.length; i++) {
                $(".overlay").append("<li class='cover-item'><img id='" + i +
                    "' class='cover-image' src='http://covers.openlibrary.org/b/id/" + results[i].cover_i + "-M.jpg'></li>");
            }
            $(".overlay").show();
            $('.cover-image').click(function() {
               var bookNumber = $(this).attr('id');
                $("#title").val(results[bookNumber].title);
                $("#author").val(results[bookNumber].author_name[0]);
                $("#book-cover-url").val("http://covers.openlibrary.org/b/id/" + results[bookNumber].cover_i + "-M.jpg");
                $("#isbn").val(results[bookNumber].isbn[0]);
                $("input[type=submit]").prop("disabled", false);
                $(".overlay").hide();
            });

        });
    });
});
$(document).ready(function(){
    $("#book-find").click(function(){
       var title = $("#title").val();
        var query = "https://openlibrary.org/search.json?title=" + encodeURIComponent(title);
        console.log(query);
        $.getJSON(query, function(data) {
            console.log(data);
           var results = data.docs;
            results = results.filter(function(element) {
               return element.cover_i != null;
            });
            if(results.length == 0)
                $(".overlay-header").text("No books with that title found.");
            else {
                $(".overlay-header").text("Pick a book that fits your search.");
                for (var i = 0; i < results.length; i += 4) {
                    $(".overlay").append("<div class='row'>");
                    for (var k = 0; i + k < results.length && k < 4; k++) {
                        var author_name = results[i + k].author_name ? results[i + k].author_name[0] : "Unknown";
                        $(".overlay").append("<div class='small-12 medium-3 columns'>" +
                            "<img id='" + (i + k) +
                            "' class='cover-image' src='http://covers.openlibrary.org/b/id/" + results[i + k].cover_i + "-M.jpg'>" +
                            "<p class='cover-info'><span class='cover-title'>" + results[i + k].title +
                            "</span> by <span class='cover-author'>" + author_name + "</span></p>" +
                            "</li></div>");
                    }

                }
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
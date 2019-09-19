$(document).ready(function() {
    var main_url = window.location.protocol + "//" + window.location.host;
    var user = null;
    var movie_fields = ["Genre", "Released", "Year", "Rated", "Director", "Writer", "Actors", "Plot", "Runtime", "Ratings", "Language", "Country", "Awards", "Production", "BoxOffice", "Website"];
    var movie_filter = { "page": 1, "search": null, "sort_field": "Ratings", "sort_order": -1, "filters": [] };
    var curr_response = {};
    var curr_cart = [];

    /*-------------------- Capitalize text utility --------------------*/
    var capitalize = function(text) {
        return text.substr(0,1).toUpperCase() + text.substr(1);
    };

    /*-------------------- Entry point for scripts on page --------------------*/
    var initMainPage = function() {
        if(typeof(sessionStorage) != 'undefined' && sessionStorage.getItem("customer")){
            user = JSON.parse(sessionStorage.getItem("customer"));
        }
        else {
            onLogoutButtonClick();
        }

        loadMovies(null);
        addEventListeners();

        if(!user) {
            onLogoutButtonClick();
        }
        else {
            if(user.role != 2) {
                $("#add_video").remove();
            }
            loadUserCart();
        }
    };

    /*-------------------- Loads user cart --------------------*/
    var loadUserCart = function() {
        var url = main_url + "/customer/getcart/" + user._id;

        $.ajax({
            type: "GET",
            url: url,
            dataType: "json",
            success: function(response){
                curr_cart = response;
                renderCart(response, true);
            },
            error: function(response){
                console.log("Error occured: " + response.responseText);
                if(response && response.error) {
                    showPopupMessage("error", response.error);
                }
            }
        });
    };

    /*-------------------- Renders user cart --------------------*/
    var renderCart = function(response, init) {
        if(!response || !response.cart || !response.cart.length) {
            $("#cart_table tbody").empty().append('<tr><td colspan="4" class="center">No cart items found.</td></tr>');
            $(".no_of_items").text(0);
            $(".popover-content #cart_footer").hide();
            $("#cart_footer").hide();
        }
        else {
            $("#cart_table tbody").empty();
            $.each(response.cart, function(i, movie) {
                var cart_data = '<tr id="tdata" data-id="' + movie._id + '"> <td>' + movie.Title + '</td>'
                                    + '<td> <input type="number" name="quantity" min="1" max="20" value=' + movie.Quantity + '></td>'
                                    + '<td>$' + movie.Price + '</td>'
                                    + '<td><a href="#" class="btn btn-default" id="delete_item"><span class="glyphicon glyphicon-trash"></span> Delete</a>'
                                    + '<a href="#" class="btn btn-info" style="margin-left: 5px;" id="update_item"><span class="glyphicon glyphicon-refresh"></span> Update</a></tr>';
                $("#cart_table tbody").append(cart_data);
            });
            $(".no_of_items").text(response.cart.length);
            $("#cart_footer").show();
            $(".popover-content #cart_footer").show();
        }

        if(init) {
            initCart();
        }
    };

    /*-------------------- Initializes popover for cart --------------------*/
    var initCart = function() {
        $('#cart-popover').popover({
            html : true,
            container: 'body',
            content:function(){
                return $('#popover_content_wrapper').html();
            }
        });
    };

    /*-------------------- Adds all event listeners on page --------------------*/
    var addEventListeners = function() {

        // Load the search results on search btn click
        $("#search_btn").on('click', function(){
            if($("#search").val().trim() == ""){
                movie_filter.search = null;
            }
            else{
                movie_filter.search = $("#search").val();
            }

            movie_filter.page = 1;
            movie_filter.filters = null;
            loadMovies();
        });

        // Pagination listeners
        $("#pagination_footer #prev_page").on("click", onPrevPageClick);
        $("#pagination_footer #next_page").on("click", onNextPageClick);

        $(document).on("click", ".description #know_more", onKnowMoreClick);
        $(document).on("click", ".description #edit_movie", onEditMovieClick);
        $(document).on("click", "#add_video", onAddMovieClick);
        $(document).on("click", ".description #delete_movie", onDeleteMovieClick);
        $('.sort_by input[type="radio"]').on("change", onSortChange);
        $('.filter_pane').on("change", '.filter_item input[type="checkbox"]', onFilterChange);

        cartListeners();
        $(document).on("change", "#movie-image", onImageChange);
        $("#edit_confirm").on("click", onSaveMovieClick);
        $("#delete_yes").on("click", onDeleteMovieConfirmClick);
        $("#goto_transactions").on("click", onGotoTransactionsClick);
        $("#go_home").on("click", backToMainPage);
        $("#logout_button").on("click", onLogoutButtonClick);
    };

    /*-------------------- Redirect to Mainpage --------------------*/
    var backToMainPage = function(){
        var url = main_url + "/mainpage";
        window.location = url;
    };

    /*-------------------- Event listener for navigations to transactions page --------------------*/
    var onGotoTransactionsClick = function() {
        window.location = main_url + "/transaction";
    };

    /*-------------------- Event listener for image change in add/edit movie --------------------*/
    var onImageChange = function() {
        var preview = $('#movie-image-preview');
        var file = $('#movie-image').prop("files");
        var reader = new FileReader();

        reader.onloadend = function () {
            preview.attr("src", reader.result);
        }

        if (file && file.length) {
            reader.readAsDataURL(file[0]);
        }
        else {
            var type = $("#myEditModal .m_header").attr("data-type");
            if(type.trim().toLowerCase() == "add") {
                preview.attr("src", "images/no-image.jpg");
            }
            else if(type.trim().toLowerCase() == "edit") {
                preview.attr("src", "images/" + $("#myEditModal .m_header").attr("data-id") + ".jpg");
            }
        }
    };

    /*-------------------- Event listener for delete movie --------------------*/
    var onDeleteMovieConfirmClick = function() {
        var movie_id = $("#myDeleteModal").attr("data-id");
        var url = main_url + "/movies/" + movie_id;

        $.ajax({
            type: "DELETE",
            url: url,
            data: JSON.stringify({}),
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            success: function(response) {
                if(response && response.success) {
                    showPopupMessage("success", "Movie deleted successfully.");
                }
                else {
                    showPopupMessage("error", "Error occured while deleting movie.");
                }
                setTimeout(function(){ window.location.reload(); }, 2000);
            },
            error: function(response) {
                console.log("Error occured: " + response.responseText);
                showPopupMessage("error", response.error);
                setTimeout(function(){ window.location.reload(); }, 2000);
            }
        });
    };

    /*-------------------- Event listener for add/edit movie --------------------*/
    var onSaveMovieClick = function() {
        var movie_object = {};

        // Title
        var movie_title = $("#movie-title").val();
        if(!movie_title || movie_title.trim() == "") {
            showPopupMessage("error", "Enter movie title!");
            return;
        }
        movie_object['Title'] = capitalize(movie_title.trim());

        // Year
        var movie_year = $("#movie-year").val();
        if(!movie_year || movie_year.trim() == "") {
            showPopupMessage("error", "Enter movie year!");
            return;
        }
        movie_year = movie_year.trim();

        if(!$.isNumeric(movie_year) || parseInt(movie_year) < 0 || parseInt(movie_year) > 9999) {
            showPopupMessage("error", "Enter valid movie year between 0 and 9999!");
            return;
        }
        movie_object['Year'] = movie_year.trim();

        // Rated
        var movie_rated = $("#movie-rated").val();
        if(!movie_rated || movie_rated.trim() == "") {
            movie_object['Rated'] = "N/A";
        }
        else {
            movie_rated = movie_rated.trim();
            if(!$.inArray(movie_rated.toLowerCase, ["g", "pg", "pg-13", "r", "nc-17"])) {
                showPopupMessage("error", "Enter valid movie rated!");
                return;
            }
            else {
                movie_object['Rated'] = movie_rated.toUpperCase();
            }
        }

        // Released
        var movie_released = $("#movie-released").val();
        if(movie_released && movie_released.trim() != "") {
            movie_object['Released'] = movie_released.trim();
        }

        // Runtime
        var movie_runtime = $("#movie-runtime").val();
        if(movie_runtime && movie_runtime.trim() != "") {
            movie_object['Runtime'] = movie_runtime.trim();
        }

        // Genre
        var movie_genre = $("#movie-genre").val();
        if(!movie_genre || movie_genre.trim() == "") {
            showPopupMessage("error", "Enter movie genre!");
            return;
        }
        else {
            var genres = [];
            $.each(movie_genre.trim().split(","), function(i, genre){
                if(genre.trim() != "") {
                    genres.push(capitalize(genre.trim()));
                }
            });

            if(genres.length == 0) {
                showPopupMessage("error", "Enter movie genre!");
                return;
            }
            else {
                movie_object["Genre"] = genres;
            }
        }

        // Director
        var movie_director = $("#movie-director").val();
        if(movie_director && movie_director.trim() != "") {
            movie_object['Director'] = capitalize(movie_director.trim());
        }

        // Writer
        var movie_writer = $("#movie-writer").val();
        if(movie_writer && movie_writer.trim() != "") {
            movie_object['Writer'] = capitalize(movie_writer.trim());
        }

        // Actors
        var movie_actors = $("#movie-actors").val();
        if(movie_actors && movie_actors.trim() != "") {
            var actors = [];
            $.each(movie_actors.trim().split(","), function(i, actor){
                if(actor.trim() != "") {
                    actors.push(capitalize(actor.trim()));
                }
            });

            if(actors.length != 0) {
                movie_object["Actors"] = actors;
            }
        }

        // Plot
        var movie_plot = $("#movie-plot").val();
        if(!movie_plot || movie_plot.trim() == "") {
            showPopupMessage("error", "Enter movie plot!");
            return;
        }
        movie_object['Plot'] = capitalize(movie_plot.trim());

        // Language
        var movie_language = $("#movie-language").val();
        if(!movie_language || movie_language.trim() == "") {
            showPopupMessage("error", "Enter movie language!");
            return;
        }
        else {
            var languages = [];
            $.each(movie_language.trim().split(","), function(i, language){
                if(language.trim() != "") {
                    languages.push(capitalize(language.trim()));
                }
            });

            if(languages.length == 0) {
                showPopupMessage("error", "Enter movie language!");
                return;
            }
            else {
                movie_object["Language"] = languages;
            }
        }

        // Country
        var movie_country = $("#movie-country").val();
        if(!movie_country || movie_country.trim() == "") {
            showPopupMessage("error", "Enter movie country!");
            return;
        }
        else {
            var countries = [];
            $.each(movie_country.trim().split(","), function(i, country){
                if(country.trim() != "") {
                    countries.push(capitalize(country.trim()));
                }
            });

            if(countries.length == 0) {
                showPopupMessage("error", "Enter movie country!");
                return;
            }
            else {
                movie_object["Country"] = countries;
            }
        }

        // Awards
        var movie_awards = $("#movie-awards").val();
        if(movie_awards && movie_awards.trim() != "") {
            movie_object['Awards'] = capitalize(movie_awards.trim());
        }

        // Ratings
        var movie_ratings = $("#movie-ratings").val();
        if(!movie_ratings || movie_ratings.trim() == "") {
            showPopupMessage("error", "Enter movie ratings!");
            return;
        }
        else if(!$.isNumeric(movie_ratings.trim())) {
            showPopupMessage("error", "Enter valid movie ratings!");
            return;
        }
        else {
            movie_ratings = parseFloat(movie_ratings.trim());
            if(movie_ratings < 0.0 || movie_ratings > 10.0) {
                showPopupMessage("error", "Enter valid movie ratings!");
                return;
            }
            movie_object['Ratings'] = parseFloat(movie_ratings.toFixed(1));
        }

        // Box office
        var movie_boxoffice = $("#movie-boxoffice").val();
        if(movie_boxoffice && movie_boxoffice.trim() != "") {
            movie_object['BoxOffice'] = movie_boxoffice.trim();
        }

        // Production
        var movie_production = $("#movie-production").val();
        if(movie_production && movie_production.trim() != "") {
            movie_object['Production'] = capitalize(movie_production.trim());
        }

        // Website
        var movie_website = $("#movie-website").val();
        if(movie_website && movie_website.trim() != "") {
            movie_website = movie_website.trim();
            var url_regex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm;
            if(url_regex.test(movie_website)) {
                movie_object['Website'] = movie_website;
            }
            else{
                showPopupMessage("error", "Enter valid movie website!");
                return;
            }
        }

        // Price
        var movie_price = $("#movie-price").val();
        if(!movie_price || movie_price.trim() == "") {
            showPopupMessage("error", "Enter movie price!");
            return;
        }
        else if(!$.isNumeric(movie_price.trim())) {
            showPopupMessage("error", "Enter valid movie price!");
            return;
        }
        else {
            movie_price = parseFloat(movie_price.trim());
            if(movie_price <= 0.0) {
                showPopupMessage("error", "Enter valid movie price!");
                return;
            }
            movie_object['Price'] = parseFloat(movie_price.toFixed(2));
        }

        // Stock
        var movie_stock = $("#movie-stock").val();
        if(!movie_stock || movie_stock.trim() == "") {
            showPopupMessage("error", "Enter movie stock!");
            return;
        }
        else if(!$.isNumeric(movie_stock.trim())) {
            showPopupMessage("error", "Enter valid movie stock!");
            return;
        }
        else {
            movie_stock = parseInt(movie_stock.trim());
            if(movie_stock <= 0) {
                showPopupMessage("error", "Enter valid movie stock!");
                return;
            }
            movie_object['Stock'] = movie_stock;
        }

        // Image
        var file = $('#movie-image').prop("files");
        var reader = new FileReader();

        reader.onloadend = function() {
            uploadImageCallback(movie_object, reader.result);
        }

        if (file && file.length) {
            reader.readAsDataURL(file[0]);
        }
        else if($("#myEditModal .m_header").attr("data-type").trim().toLowerCase() == "edit") {
            uploadImageCallback(movie_object, null);
        }
        else {
            showPopupMessage("error", "Upload valid movie image!");
            return;
        }
    };

    /*-------------------- Triggered on image upload end --------------------*/
    var uploadImageCallback = function (movie_object, result) {
        movie_object['ImageData'] = result;
        movie_object['IsDeleted'] = false;

        var type = $("#myEditModal .m_header").attr("data-type");

        if(type.trim().toLowerCase() == "add") {
            updateMovieDb(type.trim().toLowerCase(), "POST", null, movie_object);
        }
        else if(type.trim().toLowerCase() == "edit") {
            updateMovieDb(type.trim().toLowerCase(), "PUT", $("#myEditModal .m_header").attr("data-id"), movie_object);
        }
    };

    /*-------------------- Updates movie database based on add/update --------------------*/
    var updateMovieDb = function(type, method, movie_id, movie_object) {
        var url = main_url + "/movies";
        if(movie_id) {
            url += "/" + movie_id;
        }

        $.ajax({
            type: method,
            url: url,
            data: JSON.stringify(movie_object),
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            success: function(response) {
                if(response && response.success) {
                    showPopupMessage("success", "Movie added/updated successfully.");
                }
                else {
                    showPopupMessage("success", "Error occured while adding/updating movie.");
                }
                setTimeout(function(){ window.location.reload(); }, 2000);
            },
            error: function(response) {
                console.log("Error occured: " + response.responseText);
                showPopupMessage("error", response.error);
                setTimeout(function(){ window.location.reload(); }, 2000);
            }
        });
    };

    /*-------------------- Event listeners for select or deselect filter --------------------*/
    var onFilterChange = function() {
        var filter_val = $(this).val();
        var filter_field = $(this).parent().parent().attr("data-field");

        if ($(this).is(':checked')) {
            if(movie_filter.filters && movie_filter.filters.length) {
                var found = false;
                $.each(movie_filter.filters, function(i, filter) {
                    if(filter.name.trim() == filter_field.trim()) {
                        movie_filter.filters[i].values.push(filter_val);
                        found = true;
                        return false;
                    }
                });

                if(!found) {
                    var filter_obj = {};
                    filter_obj['name'] = filter_field;
                    filter_obj['values'] = [];
                    filter_obj['values'].push(filter_val);
                    movie_filter.filters.push(filter_obj);
                }
            }
            else {
                movie_filter['filters'] = [];
                var filter_obj = {};
                filter_obj['name'] = filter_field;
                filter_obj['values'] = [];
                filter_obj['values'].push(filter_val);
                movie_filter.filters.push(filter_obj);
            }
        }
        else {
            if(movie_filter.filters && movie_filter.filters.length) {
                var remove_index = -1;
                $.each(movie_filter.filters, function(i, filter) {
                    if(filter.name.trim() == filter_field.trim()) {
                        movie_filter.filters[i].values = $.grep(movie_filter.filters[i].values, function(value) {
                            return value != filter_val;
                        });

                        if(movie_filter.filters[i].values.length == 0) {
                            remove_index = i;
                        }
                        return false;
                    }
                });

                if(remove_index >= 0) {
                    movie_filter.filters = $.grep(movie_filter.filters, function(filter, index) {
                        return remove_index != index;
                    });
                }
            }
        }

        movie_filter.page = 1;
        loadMovies();
    };

    /*-------------------- Event listener for sort --------------------*/
    var onSortChange = function() {
        if ($(this).is(':checked')) {
            movie_filter.sort_field = $(this).attr("data-field");
            movie_filter.sort_order = parseInt($(this).attr("data-order"));
            movie_filter.page = 1;
            loadMovies();
        }
    };

    /*-------------------- Event listeners to move to previous page --------------------*/
    var onPrevPageClick = function() {
        if(curr_response.current_page - 1 >= 1) {
            movie_filter.page = curr_response.current_page - 1;
            loadMovies();
        }
    };

    /*-------------------- Event listeners to move to next page --------------------*/
    var onNextPageClick = function() {
        if(curr_response.current_page + 1 <= curr_response.total_pages) {
            movie_filter.page = curr_response.current_page + 1;
            loadMovies();
        }
    };

    /*-------------------- Event listener to display edit_movie popup --------------------*/
    var onAddMovieClick = function(){
        $("#myEditModal").modal();
        $("#myEditModal .m_header").attr("data-type", "add");
        $("#myEditModal .m_header").find("h4").text("Add Movie");
        var td_content = $("<tbody></tbody>");
        td_content.append("<tr><th></th><td><img id='movie-image-preview' src='images/no-image.jpg'</img></td></tr>");
        td_content.append("<tr><th>Image</th><td><input id='movie-image' type='file' name='image' accept='.jpg'></input></td></tr>");
        td_content.append("<tr><th>Title</th><td><input id='movie-title' type='text' name='title'></input></td></tr>");
        $.each(movie_fields, function(index, field) {
            td_content.append("<tr><th>" + field + "</th><td><input type='text' id='movie-" + field.toLowerCase() + "' name='" + field + "'></input></td></tr>");
        });
        td_content.append("<tr><th>Stock</th><td><input id='movie-stock' type='text'></input></td></tr>");
        td_content.append("<tr><th>Price</th><td><input id='movie-price' type='text'></input></td></tr>");
        $(".edit_content").find(".m_body").find(".edit_table").empty().append(td_content);
    };

    /*-------------------- Event listener to display edit_movie popup --------------------*/
    var onEditMovieClick = function(){
        $("#myEditModal").modal();
        var id = $(this).parent().parent().parent().find(".row1").find("h3").attr("data-id");
        $("#myEditModal .m_header").attr("data-type", "edit");
        $("#myEditModal .m_header").find("h4").text("Edit Movie");
        $.each(curr_response.data, function(i, movie){
            if(movie._id == id) {
                $("#myEditModal .m_header").attr("data-id", movie._id);
                var td_content = $("<tbody></tbody>");
                td_content.append("<tr><th></th><td><img id='movie-image-preview' src='images/" + movie._id + ".jpg'</img></td></tr>");
                td_content.append("<tr><th>Image</th><td><input id='movie-image' type='file' name='image' accept='.jpg'></input></td></tr>");
                td_content.append("<tr><th>Title</th><td><input id='movie-title' type='text' name='title' value='" + movie.Title + "'></input></td></tr>");
                $.each(movie_fields, function(index, field) {
                    if(!movie[field] || movie[field] == "" || ($.isArray(movie[field]) && movie[field].length == 0)){
                        td_content.append('<tr><th>' + field + '</th><td> <input type="text" id="movie-' + field.toLowerCase() + '" value=""></input></td></tr>');
                        return;
                    }

                    if($.isArray(movie[field])) {
                        td_content.append('<tr><th>' + field + '</th><td><input type="text" id="movie-' + field.toLowerCase() + '" value="' + movie[field].join(", ") +'"></input></td></tr>');
                    }
                    else {
                        td_content.append('<tr><th>' + field + '</th><td> <input type="text" id="movie-' + field.toLowerCase() + '" value="' + movie[field] + '"></input></td></tr>');
                    }
                });
                td_content.append("<tr><th>Stock</th><td><input id='movie-stock' type='text' value='" + movie.Stock + "'></input></td></tr>");
                td_content.append("<tr><th>Price</th><td><input id='movie-price' type='text' value='" + movie.Price + "'></input></td></tr>");
                $(".edit_content").find(".m_body").find(".edit_table").empty().append(td_content);
            }
        });
    };

    /*-------------------- Event listener to display delete_movie popup --------------------*/
    var onDeleteMovieClick = function(){
        var id = $(this).closest(".card").attr("data-id");
        $("#myDeleteModal").attr("data-id", id);
        $("#myDeleteModal").modal();
    };

    /*-------------------- Event listener to display know more popup --------------------*/
    var onKnowMoreClick = function() {
        var id = $(this).parent().parent().find(".row1").find("h3").attr("data-id");

        $.each(curr_response.data, function(i, movie){
            if(movie._id == id) {
                $(".modal-content").attr("data-id", movie._id);
                $(".modal-header").find("h2").text(movie.Title);
                var modal_left_data= $(".modal-body").find(".left_col");
                modal_left_data.find("img").attr("src","images/" + movie._id + ".jpg");
                modal_left_data.find("p").find("#price_modal").text("$" + movie.Price.toFixed(2));
                modal_left_data.find("p").find("#stock_modal").text(movie.Stock);
                var td_content = $("<tbody></tbody>");

                $.each(movie_fields, function(index, field) {
                    if(!movie[field] || movie[field] == "" || ($.isArray(movie[field]) && movie[field].length == 0)){
                        return;
                    }

                    if($.isArray(movie[field])) {
                        td_content.append('<tr><th>' + field + ' : </th><td>' + movie[field].join(", ") + '</td></tr>');
                    }
                    else if(field == "Website") {
                        td_content.append('<tr><th>' + field + ' : </th><td><a target="_blank" href="' + movie[field] + '">' + movie[field] + '</td></tr>');
                    }
                    else {
                        td_content.append('<tr><th>' + field + ' : </th><td>' + movie[field] + '</td></tr>');
                    }
                });

                $(".modal-body").find(".right_col").find(".modal_desc").empty().append(td_content);
            }
        });
    };

    /*-------------------- Delete from cart function  --------------------*/
    var onDeleteFromCart = function(movies) {
        $(".processing").removeClass("hide");
        var url = main_url + "/customer/deletecart";
        var data = {
            "customer_id": user._id,
            "movies": movies
        };

        $.ajax({
            type: "POST",
            url: url,
            data: JSON.stringify(data),
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            success: function(response) {
                curr_cart = response;
                showPopupMessage("success", "Deleted movies from cart successfully");
                renderCart(response, false);
                $(".processing").addClass("hide");
            },
            error: function(response) {
                console.log("Error occured: " + response.responseText);
                showPopupMessage("error", response.error);
                $(".processing").addClass("hide");
            }
        });
    };

    /*-------------------- Add/Update to cart function  --------------------*/
    var onAddToCart = function(movieId, quantity) {
        $(".processing").removeClass("hide");
        var url = main_url + "/customer/updatecart";
        var data = {
            "customer_id": user._id,
            "movie": {
                "id": movieId,
                "quantity": quantity
            }
        };

        $.ajax({
            type: "POST",
            url: url,
            data: JSON.stringify(data),
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            success: function(response) {
                if(response && response.error) {
                    showPopupMessage("error", response.error);
                    renderCart(curr_cart, false);
                    return;
                }
                curr_cart = response;
                showPopupMessage("success", "Updated cart successfully");
                renderCart(response, false);
                $(".processing").addClass("hide");
            },
            error: function(response) {
                console.log("Error occured: " + response.responseText);
                showPopupMessage("error", response.error);
                $(".processing").addClass("hide");
            }
        });
    };

    /*-------------------- Event listeners for cart functions --------------------*/
    var cartListeners = function(){

        // On click add to cart in results
        $(".right_pane").on("click", ".description #addToCart", function(){
            var movie_id = $(this).parents(".card").attr("data-id");
            onAddToCart(movie_id, 1);
        });

        // On click add to cart in know more
        $("#myModal").on("click", "#addToCart", function(){
            var movie_id = $(this).parents(".modal-content").attr("data-id");
            onAddToCart(movie_id, 1);
        });


        // On click update cart in cart popover
        $(document).on("click", "#update_item", function() {
            var movie_id = $(this).parents("#tdata").attr("data-id");
            var changed_quantity = $(this).parents("#tdata").find("input").val();
            if(curr_cart && curr_cart.cart) {
                $.each(curr_cart.cart, function(i, cart_item){
                    if(cart_item._id == movie_id) {
                        var quantity = changed_quantity - cart_item.Quantity;

                        if(quantity) {
                            onAddToCart(movie_id, quantity);
                        }
                        return false;
                    }
                });
            }
        });

        // On click delete in cart popover
        $(document).on("click", "#delete_item", function() {
            var movie_id = $(this).parents("#tdata").attr("data-id");
            if(curr_cart && curr_cart.cart) {
                $.each(curr_cart.cart, function(i, cart_item){
                    if(cart_item._id == movie_id) {
                        var movies = [];
                        movies.push({
                            "id": movie_id,
                            "quantity": cart_item.Quantity
                        });
                        onDeleteFromCart(movies);
                        return false;
                    }
                });
            }
        });

        // On click clear cart in cart popover
        $(document).on("click", "#clear_cart", function() {
            var movies = [];
            if(curr_cart && curr_cart.cart) {
                $.each(curr_cart.cart, function(i, cart_item){
                    movies.push({
                        "id": cart_item._id,
                        "quantity": cart_item.Quantity
                    });
                });
                onDeleteFromCart(movies);
            }
        });

        // Checkout the cart
        $(document).on("click", "#check_out_cart", function() {
            window.location = main_url + "/checkout";
        });

        // Hide any open popovers when the anywhere else in the body is clicked
        $('body').on('click', function (e) {
            $('[data-toggle=popover]').each(function () {
                if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
                    $(this).popover('hide');
                }
            });
        });
    };

    /*-------------------- Logout button listener --------------------*/
    var onLogoutButtonClick = function() {
        var url = main_url + "/customer/terminate/logout";
        $.ajax({
            type: "GET",
            url: url,
            dataType: "json",
            success: function(response){
                sessionStorage.clear();
                window.location = main_url + "/index";
            },
            error: function(response){
                console.log("Error occured: " + response.responseText);
                sessionStorage.clear();
                window.location = main_url + "/index";
            }
        });
    };

    /*-------------------- Loads movies from database based on criteria --------------------*/
    var loadMovies = function() {
        $(".processing").removeClass("hide");
        var url = main_url + "/movies/getmovies";

        $.ajax({
            type: "POST",
            url: url,
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(movie_filter),
            success: function(response){

                curr_response = response;

                if(!response || !response.data || response.data.length == 0 || response.current_total == 0 || response.total == 0) {
                    $(".container").find(".right_pane .content").empty().append('<div class="no_response">No results found. Try using different criteria.</div>');
                    $("#pagination_footer").hide();
                    $(".processing").addClass("hide");
                    updateFiltersPane();
                    return;
                }

                // Append html card content to display movie data
                $(".container").find(".right_pane .content").empty();
                $.each(response.data, function(i, movie) {
                    var html_content = '<div class="col-sm-3 card" data-id="' + movie._id + '">' +
                                        '<div class="row">' +
                                        '<img src="images/' + movie._id + '.jpg" alt="movie_image" class="movie_images"/>' +
                                        '</div>' +
                                        '<div class="row description">' +
                                        '<div class="row1"><h3 data-id="' + movie._id + '">' + movie.Title.toUpperCase() + '</h3>'+
                                        '<p class="desc"><b>GENRE : </b>' + movie.Genre.join(", ") + '</p>'+
                                        '<p class="desc"><b>RATING : </b>' + movie.Ratings.toFixed(2) + '</p>'+
                                        '<p class="desc"><b>PRICE : </b>$' + movie.Price.toFixed(2) + '</p></div>'+
                                        '<div class="col-sm-12" style="margin: 3% 0;">'+
                                        '<button type="button" class="btn btn-primary" id="know_more" data-toggle="modal" data-target="#myModal">KNOW MORE...</button></div>'+
                                        '<div class="col-sm-12" style="margin: 3% 0;">'+
                                        '<button type="button" id="addToCart">ADD TO CART</button></div>';
                    if(user.role == 2){
                        html_content = html_content +
                                    '<div class="row admin_func"> <div class="col-sm-6">' +
                                    '<button type= "button" class="btn btn-primary" id="edit_movie" data-toggle="modal_edit" data-target="#edit_modal"> Edit</button>' +
                                    '</div>' +
                                    '<div class="col-sm-6">' +
                                    '<button type= "button" id="delete_movie"> Delete</button>' +
                                    '</div></div></div></div>';

                        $(".container").find(".right_pane .content ").append(html_content);
                    }
                    else{
                        $(".container").find(".right_pane .content").append(html_content + "</div></div>");
                    }
                });

                // Update pagination footer
                updatePagination();

                // Update filters
                if(response.current_page == 1) {
                    updateFiltersPane();
                }
                $(".processing").addClass("hide");
            },
            error: function(response){
                console.log("Error occured: " + response.responseText);
                $(".container").find(".right_pane .content").empty().append('<div class="no_response">Error occurred. Could not fetch response.</div>');
                $("#pagination_footer").hide();
                updateFiltersPane();
                $(".processing").addClass("hide");
            }
        });
    };//loadMovies end

    /*-------------------- Updates pagination footer info based on response --------------------*/
    var updatePagination = function() {
        var pagination_footer = $("#pagination_footer");
        pagination_footer.find("#page_num").text(curr_response.current_page);
        pagination_footer.find("#page_total").text(curr_response.total_pages);
        pagination_footer.find("#prev_page").removeClass("disabled");
        pagination_footer.find("#next_page").removeClass("disabled");
        if(curr_response.current_page == 1) {
            pagination_footer.find("#prev_page").addClass("disabled");
        }
        if(curr_response.current_page == curr_response.total_pages) {
            pagination_footer.find("#next_page").addClass("disabled");
        }
        pagination_footer.show();
    }

    /*-------------------- Updates Filters info based on response --------------------*/
    var updateFiltersPane = function() {
        var genre_filter = $(".filter_pane .genre_filter");
        var ratings_filter = $(".filter_pane .ratings_filter");
        var lang_filter = $(".filter_pane .lang_filter");
        var countries_filter = $(".filter_pane .countries_filter");

        genre_filter.find(".filter_item").remove().end().find(".no_filter").remove();
        ratings_filter.find(".filter_item").remove().end().find(".no_filter").remove();
        lang_filter.find(".filter_item").remove().end().find(".no_filter").remove();
        countries_filter.find(".filter_item").remove().end().find(".no_filter").remove();

        if(!curr_response.filters) {
            genre_filter.append('<div class="no_filter"> - None - </div>');
            ratings_filter.append('<div class="no_filter"> - None - </div>');
            lang_filter.append('<div class="no_filter"> - None - </div>');
            countries_filter.append('<div class="no_filter"> - None - </div>');
            return;
        }

        // Setting Genre filters
        if(curr_response.filters.genres && curr_response.filters.genres.length) {
            $.each(curr_response.filters.genres, function(i, genre) {
                genre_filter.append('<div class="filter_item"><input type="checkbox" value="' + genre + '" ><span>' + genre + '</span></div>');
            });
        }
        else {
            genre_filter.append('<div class="no_filter"> -None- </div>');
        }

        // Setting Rated filters
        if(curr_response.filters.rated && curr_response.filters.rated.length) {
            $.each(curr_response.filters.rated, function(i, rated) {
                ratings_filter.append('<div class="filter_item"><input type="checkbox" value="' + rated + '" ><span>' + rated + '</span></div>');
            });
        }
        else {
            ratings_filter.append('<div class="no_filter"> -None- </div>');
        }

        // Setting Language filters
        if(curr_response.filters.languages && curr_response.filters.languages.length) {
            $.each(curr_response.filters.languages, function(i, language) {
                lang_filter.append('<div class="filter_item"><input type="checkbox" value="' + language + '" ><span>' + language + '</span></div>');
            });
        }
        else {
            lang_filter.append('<div class="no_filter"> -None- </div>');
        }

        // Setting Country filters
        if(curr_response.filters.countries && curr_response.filters.countries.length) {
            $.each(curr_response.filters.countries, function(i, country) {
                countries_filter.append('<div class="filter_item"><input type="checkbox" value="' + country + '" ><span>' + country + '</span></div>');
            });
        }
        else {
            countries_filter.append('<div class="no_filter"> -None- </div>');
        }

        // Updating rendered filters based on searched filters
        if(movie_filter.filters && movie_filter.filters.length) {
            var updated_filters = [];
            var filter_list = {};

            $.each(movie_filter.filters, function(i, filter) {
                var selector = null;
                if(filter.name == "Genre") {
                    selector = $(".filter_pane .genre_filter");
                }
                else if(filter.name == "Rated") {
                    selector = $(".filter_pane .ratings_filter");
                }
                else if(filter.name == "Language") {
                    selector = $(".filter_pane .lang_filter");
                }
                else if(filter.name == "Country") {
                    selector = $(".filter_pane .countries_filter");
                }
                else {
                    return true;
                }

                if(filter.values && filter.values.length) {
                    $.each(filter.values, function(index, fil_val) {
                        var filter_item = selector.find('input[value="' + fil_val.trim() + '"]');
                        if(filter_item.length) {
                            filter_item.prop("checked", true);
                            if(filter_list[filter.name] == null) {
                                updated_filters.push({ "name": filter.name, values: []});
                                filter_list[filter.name] = i;
                            }

                            updated_filters[filter_list[filter.name]].values.push(fil_val);
                        }
                    });
                }
            });

            movie_filter.filters = updated_filters;
        }
    };

    /*-------------------- Popup message rendering --------------------*/
    var showPopupMessage = function (type, message){
    	var messageElement = $("#pop-up-message");
    	messageElement.text(message);
    	messageElement.addClass(type + " visible");

    	setTimeout(function(){
    		messageElement.removeClass(type + " visible");
    	}, 3500);
    };

    initMainPage();
});

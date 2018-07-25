$(function () {
    $("#my_button").click(function () {
        var email = $("input#email").val();
        if (email == "") {
            alert("Please enter an email address");
            return false
        }
        var filter = /^([a-zA-Z0-9_.-])+@(([a-zA-Z0-9-])+.)+([a-zA-Z0-9]{2,4})+$/;
        if (!filter.test(email)) {
            alert('Please provide a valid email address');
            return false
        }
        var numchk = $("input[class='rssnsltr']:checked").length;
        if (numchk == 0) {
            alert('Please select the newsletter(s) you would like to receive');
            return false
        }
    })

    $("#flex_button").click(function () {
        var email = $("input#email").val();
        if (email == "") {
            alert("Please enter an email address");
            return false
        }
        var filter = /^([a-zA-Z0-9_.-])+@(([a-zA-Z0-9-])+.)+([a-zA-Z0-9]{2,4})+$/;
        if (!filter.test(email)) {
            alert('Please provide a valid email address');
            return false
        }
        var numchk = $("input[class='rssnsltr']:checked").length;
        if (numchk == 0) {
            alert('Please select the newsletter(s) you would like to receive');
            return false
        }
    })

});

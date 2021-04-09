$("#otp-signup-form").validate({
    rules: {

        name: {
            required: true
        },
        email: {
            required: true,
            email: true

        },
        phone: {
            required: true,
            number:true,
            minlength: 10,
            maxlength: 10
        },
        password: {
            required: true,

        }

    },
    submitHandler: (form, e) => {
        console.log("signup checking")
        e.preventDefault();
        $.ajax({
         
            data: $('#otp-signup-form').serialize(),
            method: "POST",
            url: "/signup",
            success: function (response) {
                console.log(response)
                if (response.emailExist) {
                    document.getElementById('existError').innerHTML = "Email already Exist"
                } else if (response.status){
                    document.getElementById('otp-form').style.visibility = 'visible'
                    document.getElementById("otp-signup-form").style.visibility = 'hidden'
                    document.getElementById('otp-phone').value = response.phone
                }
                else {
                    console.log("hello")
                }
            },
            error: function (err) {
                console.log(err)
                alert("Something Error :"+ err)

            }
        })
    }


});
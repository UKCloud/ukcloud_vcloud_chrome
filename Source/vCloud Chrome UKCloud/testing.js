function getip()
{
$.getJSON('http://ipinfo.io', function(data){
	$("#div1").html(data.ip);
	console.log(data);
 });
}

document.addEventListener('DOMContentLoaded', function() {
    var link = document.getElementById('testbutton');
    // onClick's logic below:
    link.addEventListener('click', function() {
        getip();
    });
});
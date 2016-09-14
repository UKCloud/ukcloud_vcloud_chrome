var auth = "";
var configurl = '';
var configtype = '';
var tasks = [];

function getip()
{
$.getJSON('http://ipinfo.io', function(data){
	$("#div1").html(data.ip);
	console.log(data);
 });
};

function saveinputs(apiurl,username,password,org){
	chrome.storage.local.set({'apiurl':apiurl});
	chrome.storage.local.set({'username':username});
	//chrome.storage.local.set({'password':password});
	chrome.storage.local.set({'org':org});
};

function loaddata() {
	console.log("Hello");
	chrome.storage.local.get('apiurl', function(result) {
			$("#apiurl").val(result.apiurl);
	});

	chrome.storage.local.get('uk_username', function(result) {
			$("#ukcloud_username").val(result.uk_username);
	});
	
	/*chrome.storage.local.get('uk_password', function(result) {
			$("#ukcloud_password").val(result.uk_password);
	});
	*/
	
	chrome.storage.local.get('apiurl', function(result) {
			$("#apiurl").val(result.apiurl);
	});
	
	chrome.storage.local.get('username', function(result) {
			$("#username").val(result.username);
	});
	/*
	chrome.storage.local.get('password', function(result) {
			$("#password").val(result.password);
	});
	*/
	chrome.storage.local.get('org', function(result) {
			$("#org").val(result.org);
	});
	
	chrome.storage.local.get('xvcloudauthorization', function(result) {
			auth = result.xvcloudauthorization;
			console.log(auth);
	});
	
};

function getcookie()
{

	var apiurl = $("#apiurl").val();
	var lastchar = apiurl.slice(-1);
	if(lastchar != "/")
	{
		apiurl = apiurl + "/";
		$("#apiurl").val(apiurl);
	}
	var username = $("#username").val();
	var password = $("#password").val();
	var org = $("#org").val();
	saveinputs(apiurl,username,password,org);
	console.log(apiurl + ' ' + username + ' ' + password + ' ' + org);
	var loginstring = username + "@" + org + ":" + password;
	var encoded = window.btoa(loginstring);
	
	$.ajax({
		type: "POST",
		beforeSend: function (request)
		{
			request.setRequestHeader("Accept", "application/*+xml;version=5.6");
			request.setRequestHeader("Authorization", "Basic " + encoded);
			$("#loginstatus").text("Login Status: Logging In")
			$("#loginstatus").removeClass("btn-danger").addClass("btn-info");
		},
		url: apiurl + '/sessions',
		complete: function(data, textStatus, request) {
			console.log(data);
			auth = data.getResponseHeader('x-vcloud-authorization');
			if(auth)
			{
					$("#loginstatus").text("Login Status: Logged In")
					$("#loginstatus").removeClass("btn-info").addClass("btn-success");
					$(".only-loggedin").show()
			}
			else
			{
					$("#loginstatus").text("Login Status: Failed Login")
					$("#loginstatus").removeClass("btn-info").addClass("btn-danger");
					$(".only-loggedin").hide()
			}
			console.log(auth);
			chrome.storage.local.set({'xvcloudauthorization':auth});
		}
		
	});
};

function get_edge_config(url)
{
	console.log("Attempting to get URL: " + url);
	
	var res =  $.ajax({
		type: "GET",
		dataType: "xml",
		beforeSend: function (request)
		{
			request.setRequestHeader("Accept", "application/*+xml;version=5.6");
			request.setRequestHeader("x-vcloud-authorization", auth);
			$('#getxmlspinny').show();
		},
		url: url,
		complete: function(data)
		{
			
			var xmlres = $.parseXML(data.responseText);
			//$("#response").html(data.responseText);
			configurl = '';
			configtype = '';
			var configsection = $(xmlres).find("EdgeGatewayServiceConfiguration")[0];
			render_firewall_table(configsection)
			render_nat_table(configsection);
			render_vpn_table(configsection);
			$(xmlres).find("Link").each(function (link) {
				if($(this)[0].attributes['rel'].value == "edgeGateway:configureServices")
				{
					configurl = $(this)[0].attributes['href'].value;
					configtype = $(this)[0].attributes['type'].value;
				}
			});
			
			if(configurl)
			{
				$("#actiondiv").show()
			}
			else
			{
				$("#actiondiv").hide()
			}
			
			var xmlString = (new XMLSerializer()).serializeToString(configsection);
			//console.log(data.responseText);
			//console.log(xmlString);
			console.log("Update URL: " + configurl);
			console.log("Update Type: " + configtype);
			if($(".CodeMirror").length)
			{
				var ta = $(".CodeMirror");
				var editor = CodeMirror(function(elt) {
					ta.replaceWith(elt);
					}, {
					value: xmlString,
					mode: 'xml'
				});
				setTimeout(function() {
					console.log("Refreshing Editor...");
                    $(".CodeMirror")[0].CodeMirror.refresh();
                }, 2000);
			}
			else
			{
				var ta = $("#editor");
				console.log(ta);
				var editor = CodeMirror(function(elt) {
					ta.replaceWith(elt);
					}, {
					value: xmlString,
					mode: 'xml'
				});
				setTimeout(function() {
					console.log("Refreshing Editor...");
                     $(".CodeMirror")[0].CodeMirror.refresh();
                }, 2000);
				
			}
			
			
			
			$('#getxmlspinny').hide();
			
		
			
			//$(".CodeMirror").css('font-size',"10pt").css('height','100%');
		}
	});
}

function clear_vshieldform()
{
	
	$("#orgs").find('option').remove()
	$("#orgs").append($('<option>', {
		value: 0,
		text: 'Please Select...'
	}));
	$("#orgslabel").html("Organisations");
	$("#vdcs").find('option').remove()
	$("#vdcs").append($('<option>', {
		value: 0,
		text: 'Please Select...'
	}));
	$("#vdclabel").html("Virtual Datacenters");
	$("#gateways").find('option').remove()
	$("#gateways").append($('<option>', {
		value: 0,
		text: 'Please Select...'
	}));
	$("#gatewaylabel").html("vShield Edge Gateways");
}

function clear_vshielddata()
{
	$("#fwtable").html("");
	$("#nattable").html("");
	$("#vpntable").html("");
	var cms = $(".CodeMirror");
	if(cms.length)
	{
		$(".CodeMirror").hide();
	}
}

function get_edge_data(vdc)
{
	var apiurl = $("#apiurl").val();
	var responsestring;
	
	var res =  $.ajax({
		type: "GET",
		dataType: "xml",
		beforeSend: function (request)
		{
			request.setRequestHeader("Accept", "application/*+xml;version=5.6");
			request.setRequestHeader("x-vcloud-authorization", auth);
			$('#getvdc_spinner').show();
		},
		url: apiurl + '/query?type=edgeGateway&filter=(vdc=='+vdc.split('/').pop(-1)+')',
		complete: function(data)
		{
			var xmlres = $.parseXML(data.responseText);
			$("#gateways").find('option').remove()
			$("#gateways").append($('<option>', {
							value: 0,
							text: 'Please Select...'
						}));
						var orgcount = $(xmlres).find('EdgeGatewayRecord').length;
						$("#gatewaylabel").html("vShield Edge Gateways (" + orgcount + ")");
			$(xmlres).find('EdgeGatewayRecord').each(function(record){
					//$("#response").html($("#response").html() + ($(this)[0].attributes['name'].value) + '<br>');
					//console.log($(this)[0]);
					
					$("#gateways").append($('<option>',{
							value: $(this)[0].attributes['href'].value,
							text: $(this)[0].attributes['name'].value
					}));
			});
			$('#getvdc_spinner').hide();
			
		}
	});
}

function search_vcloud(searchtype,filter)
{
	var apiurl = $("#apiurl").val();
	var responsestring;
	var thisurl = apiurl + '/query?type=' + searchtype;
	
	if(filter)
	{
		thiurl = thisurl + '&filter=(' + filter + ')';
	}
	
	
	$.ajax({
		type: "GET",
		dataType: "xml",
		beforeSend: function (request)
		{
			request.setRequestHeader("Accept", "application/*+xml;version=5.6");
			request.setRequestHeader("x-vcloud-authorization", auth);
			$('#getvdc_spinner').show();
		},
		url: thisurl,
		complete: function(data)
		{
				var xmlres = $.parseXML(data.responseText);
				var recordtype;
				switch(searchtype) {
					case 'edgeGateway':
						recordtype='EdgeGatewayRecord';
						break;
					case 'vm':
						recordtype='VMRecord';
						break;
					case 'vApp':
						recordtype='VAppRecord';
						break;
					case 'orgVdc':
						recordtype='OrgVdcRecord';
						break;
					case 'organization':
						recordtype='OrgRecord';
						break;
				};
				if(searchtype=='orgVdc')
					{
						$("#vdcs").find('option').remove()
						$("#vdcs").append($('<option>', {
							text: "Please Select...",
							value: 0
						}));
						var orgcount = $(xmlres).find(recordtype).length;
						$("#vdclabel").html("Virtual Datacenters (" + orgcount + ")");
						$(xmlres).find(recordtype).each(function(record){
					//$("#response").html($("#response").html() + ($(this)[0].attributes['name'].value) + '<br>');
					//console.log($(this)[0]);
					if(searchtype=='orgVdc')
					{
					$("#vdcs").append($('<option>',{
							value: $(this)[0].attributes['href'].value,
							text: $(this)[0].attributes['name'].value
					}));
				};
				});
					}
					
				if(searchtype=='organization')
				{
						$("#orgs").find('option').remove()
						$("#orgs").append($('<option>', {
							text: "Please Select...",
							value: 0
						}));
						console.log(data.responseText);
						var orgcount = $(xmlres).find(recordtype).length;
						$("#orgslabel").html("Organisations (" + orgcount + ")");
						$(xmlres).find(recordtype).each(function(record){
					//$("#response").html($("#response").html() + ($(this)[0].attributes['name'].value) + '<br>');
					//console.log($(this)[0]);
					if(searchtype=='organization')
					{
					$("#orgs").append($('<option>',{
							value: $(this)[0].attributes['href'].value,
							text: $(this)[0].attributes['name'].value + ' - ' + $(this)[0].attributes['displayName'].value
					}));
				};
				});
				}
						
				
				console.log(xmlres);
				//$("#response").val(data.responseText);
				$('#getvdc_spinner').hide();
		}
	});
	//console.log(res);
	
}

function getvms()
{
	search_vcloud('vm');
};

function getedges()
{
	search_vcloud('edgeGateway');
	
};

function getvapps()
{
	search_vcloud('vApp');
};

function getvdcs()
{
	search_vcloud('orgVdc');
};

function getorgs()
{
	search_vcloud('organization');
};
		
function get_taskstatus(url)
{
	
	
	
var res =  $.ajax({
		type: "GET",
		dataType: "xml",
		beforeSend: function (request)
		{
			request.setRequestHeader("Accept", "application/*+xml;version=5.6");
			request.setRequestHeader("x-vcloud-authorization", auth);
			
		},
		url: url,
		complete: function(data)
		{
				var xmlres = $.parseXML(data.responseText);
				$(xmlres).find('Task').each(function(record) {
					var currentstatus = $(this)[0].attributes['status'].value;
					console.log("Task Status: " + currentstatus);
				});
			
		}
	});
	//console.log(res);
	
}	

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

	
function post_back()
{
	var editor = $('.CodeMirror')[0].CodeMirror;
	var configdata = editor.getValue();
	console.log(configdata);
	
	$.ajax({
		type: "POST",
		beforeSend: function (request)
		{
			request.setRequestHeader("Accept", "application/*+xml;version=5.6");
			request.setRequestHeader("Content-Type",configtype);
			
			request.setRequestHeader("x-vcloud-authorization", auth);
		},
		url: configurl,
		data: configdata,
		success: function(data, textStatus, request) {
			console.log("Success");
			console.log(data);
			console.log(request);
			
		},
		error: function(data, textStatus, request) {
			console.log("ERROR");
			console.log(data);
			console.log(request);
		},
		complete: function(data) {
				var xmlres = $.parseXML(data.responseText);
				console.log(xmlres);
				$(xmlres).find('Task').each(function(record) {
					var obj = {
						href: $(this)[0].attributes['href'].value,
						operation: $(this)[0].attributes['operation'].value,
						operationname: $(this)[0].attributes['operation'].value,
						status: $(this)[0].attributes['status'].value,
						starttime: $(this)[0].attributes['startTime'].value,
					};
					tasks.push(obj);
					console.log(tasks);
					refresh_tasks()
				});
		}
		
	});
}

function refresh_tasks()
{
	$(tasks).each(function (data) {
		if(this.status == "running")
		{
		var newstatus = '';
		console.log("Processing..." + this);
			$.ajax({
			type: "GET",
			dataType: "xml",
			beforeSend: function (request)
			{
				request.setRequestHeader("Accept", "application/*+xml;version=5.6");
				request.setRequestHeader("x-vcloud-authorization", auth);
				
			},
			url: this.href,
			complete: function(data)
			{
					
					var xmlres = $.parseXML(data.responseText);
					$(xmlres).find('Task').each(function(record) {
						var currentstatus = $(this)[0].attributes['status'].value;
						console.log("Task Status: " + currentstatus);
						newstatus = $(this)[0].attributes['status'].value;
						updatearray($(this)[0]);
					});
					
			}
		});
		
	}})
	
}

function updatearray(data)
{
	console.log("Updating array with...");
	console.log(data);
	var xmlres = $.parseXML(data);
	console.log(xmlres);
	taskhref = data.attributes['href'].value;
	taskstatus = data.attributes['status'].value;
	console.log(taskhref);
	console.log(taskstatus);
	
	$(tasks).each(function (data) {
		if(this.href == taskhref)
		{
			this.status = taskstatus;
		}
	});
	
	var HTML = ("<table class='table table-striped'><thead><tr><th>Start Time</th><th>Operation</th><th>Status</th></tr></thead><tbody>");
	$(tasks).each(function (data) {
		HTML = HTML + "<tr scope='row'><td>" + this.starttime + "</td><td>" + this.operation + "</td><td>" + this.status + "</td></tr>";
	})
	HTML = HTML + "</tbody></table>"
	$("#taskstable").html(HTML);
	console.log(HTML);
	
}

function render_firewall_table(data)
{
	var fwtable = "";

	fwtable = `
	<table class='table table-striped'>
		<thead>
			<tr>
				<th>#</th>
				<th>IsEnabled</th>
				<th>Description</th>
				<th>Source</th>
				<th>Destination</th>
				<th>Protocols</th>
				<th>Log</th>
			</tr>
		</thead>
		<tbody>
	`;
/*
	Sample Data
	<Id>1</Id>
	<IsEnabled>true</IsEnabled>
	<MatchOnTranslate>false</MatchOnTranslate>
	<Description>External Access</Description>
	<Policy>allow</Policy>
	<Protocols>
		<Any>true</Any>
	</Protocols>
	<Port>-1</Port>
	<DestinationPortRange>Any</DestinationPortRange>
	<DestinationIp>external</DestinationIp>
	<SourcePort>-1</SourcePort>
	<SourcePortRange>Any</SourcePortRange>
	<SourceIp>internal</SourceIp>
	<EnableLogging>false</EnableLogging>
*/
	$(data).find("FirewallRule").sort(function(a, b){
		return (parseInt($(a).find('Id').text()) - parseInt($(b).find("Id").text()));
	}).each(function (fw) {
		
		var Id = $(this).find('Id').text();
		var IsEnabled = $(this).find('IsEnabled').text();
		var MatchOnTranslate = $(this).find('MatchOnTranslate').text();
		var Description = $(this).find('Description').text();
		var Policy = $(this).find('Policy').text();
		var Protocols = $(this).find('Protocols').text();
		var Port = $(this).find('Port').text();
		var DestinationPortRange = $(this).find('DestinationPortRange').text();
		var DestinationIp = $(this).find('DestinationIp').text();
		var SourcePort = $(this).find('SourcePort').text();
		var SourcePortRange = $(this).find('SourcePortRange').text();
		var SourceIp = $(this).find('SourceIp').text();
		var EnableLogging = $(this).find('EnableLogging').text();
		var fwrow = `
			<tr>
				<th>${Id}</th>
				<td>${IsEnabled}</td>
				<td>${Description}</td>
				<td>${SourceIp}:${SourcePortRange}</td>
				<td>${DestinationIp}:${DestinationPortRange}</td>
				<td>${Protocols}</td>
				<td>${EnableLogging}</td>
			</tr>
		`;
		fwtable = fwtable + fwrow;
		console.log("FW Rule...#:" + Id);
		console.log();
	});
	fwtable = fwtable + "</tbody></table>"
	console.log(fwtable);
	$("#fwtable").html(fwtable);
}

function render_vpn_table(data)
{
	var vpntable = "";

	vpntable = `
	<table class='table table-striped'>
		<thead>
			<tr>
				<th>Name</th>
				<th>Description</th>
				<th>PeerIpAddress</th>
				<th>LocalIpAddress</th>
				<th>LocalSubnet</th>
				<th>PeerSubnet</th>
				<th>MTU</th>
				<th>IsEnabled</th>
				<th>IsOperational</th>
			</tr>
		</thead>
		<tbody>
	`;

	$(data).find("Tunnel").sort(function(a, b){
		return (parseInt($(a).find('Id').text()) - parseInt($(b).find("Id").text()));
	}).each(function (fw) {
		
		var Name = $(this).find('Name').first().text();
		var Description = $(this).find('Description').first().text();
		var PeerIpAddress = $(this).find('PeerIpAddress').first().text();
		var LocalIpAddress = $(this).find('LocalIpAddress').first().text();
		var localsubnets = "";
		$(this).find('LocalSubnet').each(function () {
			console.log("Processing..." + $(this));
			var ls_name = $(this).find('Name').text();
			var ls_gateway = $(this).find('Gateway').text();
			var ls_netmask = $(this).find('Netmask').text();
			localsubnets = localsubnets + `
				Name: ${ls_name}<br>
				 - GW: ${ls_gateway}<br>
				 - Mask: ${ls_netmask}<br>
			`;
		});
		
		var peersubnets = "";
		$(this).find('PeerSubnet').each(function () {
			var ps_name = $(this).find('Name').text();
			var ps_gateway = $(this).find('Gateway').text();
			var ps_netmask = $(this).find('Netmask').text();
			peersubnets = peersubnets + `
				Name: ${ps_name}<br>
				 - GW: ${ps_gateway}<br>
				 - Mask: ${ps_netmask}<br>
			`;
		});
		
		
		var Mtu = $(this).find('Mtu').text();
		var IsEnabled = $(this).find('IsEnabled').text();
		var IsOperational = $(this).find('IsOperational').text();
		
		var vpnrow = `
			<tr>
				<td>${Name}</td>
				<td>${Description}</td>
				<td>${PeerIpAddress}</td>
				<td>${LocalIpAddress}</td>
				<td>${localsubnets}</td>
				<td>${peersubnets}</td>
				<td>${Mtu}</td>
				<td>${IsEnabled}</td>
				<td>${IsOperational}</td>
			</tr>
		`;
		vpntable = vpntable + vpnrow;
		console.log("VPN Tunnel...#:" + Name);
		console.log();
	});
	vpntable = vpntable + "</tbody></table>"
	console.log(vpntable);
	$("#vpntable").html(vpntable);
}


function render_nat_table(data)
{
	var nattable = "";

	nattable = `
	<table class='table table-striped'>
		<thead>
			<tr>
				<th>#</th>
				<th>IsEnabled</th>
				<th>RuleType</th>
				<th>OriginalIp</th>
				<th>OriginalPort</th>
				<th>TranslatedIp</th>
				<th>TranslatedPort</th>
				<th>Protocol</th>
			</tr>
		</thead>
		<tbody>
	`;
/*
	Sample Data
	 <NatRule>
		<RuleType>DNAT</RuleType>
		<IsEnabled>true</IsEnabled>
		<Id>65538</Id>
		<GatewayNatRule>
			<Interface href="https://api.vcd.portal.skyscapecloud.com/api/admin/network/42ef79a1-b423-4edb-be27-d59486928c70" name="nft00013i2" type="application/vnd.vmware.admin.network+xml"/>
			<OriginalIp>37.26.89.196</OriginalIp>
			<OriginalPort>22</OriginalPort>
			<TranslatedIp>192.168.2.10</TranslatedIp>
			<TranslatedPort>22</TranslatedPort>
			<Protocol>tcp</Protocol>
		</GatewayNatRule>
	</NatRule>
*/
	$(data).find("NatRule").sort(function(a, b){
		return (parseInt($(a).find('Id').text()) - parseInt($(b).find("Id").text()));
	}).each(function (fw) {
		
		var Id = $(this).find('Id').text();
		var RuleType = $(this).find('RuleType').text();
		var IsEnabled = $(this).find('IsEnabled').text();
		var OriginalIp = $(this).find('OriginalIp').text();
		var OriginalPort = $(this).find('OriginalPort').text();
		var TranslatedIp = $(this).find('TranslatedIp').text();
		var TranslatedPort = $(this).find('TranslatedPort').text();
		var Protocol = $(this).find('Protocol').text();
		
		var natrow = `
			<tr>
				<th>${Id}</th>
				<td>${IsEnabled}</td>
				<td>${RuleType}</td>
				<td>${OriginalIp}</td>
				<td>${OriginalPort}</td>
				<td>${TranslatedIp}</td>
				<td>${TranslatedPort}</td>
				<td>${Protocol}</td>				
			</tr>
		`;
		nattable = nattable + natrow;
		console.log("NAT Rule...#:" + Id);
		console.log();
	});
	nattable = nattable + "</tbody></table>"
	console.log(nattable);
	$("#nattable").html(nattable);
}

function getukcloud_accounts()
{
	
	var uk_username = $("#ukcloud_username").val();
	var uk_password = $("#ukcloud_password").val();
	
	chrome.storage.local.set({'uk_password':uk_password});
	chrome.storage.local.set({'uk_username':uk_username});
	
	var logindata = {"email": uk_username, "password": uk_password};
	$.ajax({
		type: "POST",
		beforeSend: function (request)
		{
			request.setRequestHeader("Content-Type", "application/json");
			$("#getaccounts_spinner").show()
			$("#ukcloud_options").hide();
		},
		dataType: 'json',
		data: JSON.stringify(logindata),
		url: 'https://portal.skyscapecloud.com/api/authenticate',
		complete: function(data, textStatus, request) {
			console.log(data);
			console.log(textStatus);
			console.log(request);
			$.ajax({
				type: "GET",
				dataType: "json",
				beforeSend: function (request)
				{
					request.setRequestHeader("Content-Type", "application/json");
				},
				url: 'https://portal.skyscapecloud.com/api/accounts',
				complete: function(data)
				{
						var accounts = JSON.parse(data.responseText);
						$("#accounts").find('option').remove()
						$("#accounts").append($('<option>', {
							text: "Please Select...",
							value: 0
						}));
						$(accounts).each(function() {
							console.log(this);
							$("#accounts").append($('<option>', {
								text: this.name,
								value: this.id
							}));
						});
					$("#getaccounts_spinner").hide()
					$("#ukcloud_options").show();
				}
			});
		}
		
	});
}

function get_ukcloud_services(service_id)
{
	$.ajax({
				type: "GET",
				dataType: "json",
				beforeSend: function (request)
				{
					request.setRequestHeader("Content-Type", "application/json");
					$("#services").hide();
					$("#services_spinny").show();
					$("#getservices_spinner").show()
				},
				url: 'https://portal.skyscapecloud.com/api/accounts/' + service_id + '/api_credentials',
				complete: function(data)
				{
						var services = JSON.parse(data.responseText);
						console.log(services);
						$("#services").find('option').remove()
						$("#services").append($('<option>', {
							text: "Please Select...",
							value: 0
						}));
						$.each( services, function( key, value ) {
							console.log(this);
							$("#services").append($('<option>', {
								text: key,
								value: value.username
							}));
						});
						
						
						$("#services_spinny").hide();
						$("#services").show();
						$("#getservices_spinner").hide()
					
				}
			});
}

document.addEventListener('DOMContentLoaded', function() {
    
	loaddata();
	var link = document.getElementById('getcookie');
    link.addEventListener('click', function() {
        clear_vshieldform();
		getcookie();
    });
	
	//var vdcs = document.getElementById('getvdcs');
    //vdcs.addEventListener('click', function() {
     //   getvdcs();
    //});
	
	var orgs = document.getElementById('getorgs');
    orgs.addEventListener('click', function() {
		clear_vshieldform();
		clear_vshielddata();
		$("#actiondiv").hide();
        getorgs();
    });
	
	var ukcloud_accounts = document.getElementById('getaccounts');
    ukcloud_accounts.addEventListener('click', function() {
		
		getukcloud_accounts();
		$("#credflash").hide()
    });
	
	var orglist = document.getElementById('orgs');
	orglist.addEventListener('change', function() {
		if($(this).val() != "Please Select...")
		{
			clear_vshielddata();
			$("#actiondiv").hide();
			search_vcloud('orgVdc','org=='+$(this).val().split("/").pop(-1));
		}
	});
	
	var vdclist = document.getElementById('vdcs');
	vdclist.addEventListener('change', function() {
		if($(this).val() != "Please Select...")
		{
			clear_vshielddata();
			$("#actiondiv").hide();
			get_edge_data($(this).val());
		}
	});
	
	var accountslist = document.getElementById('accounts');
	accountslist.addEventListener('change', function() {
		get_ukcloud_services($(this).val());
		$("#credflash").hide()
	});
	
	var serviceslist = document.getElementById('services');
	serviceslist.addEventListener('change', function() {
		var creds = $(this).val();
		$("#username").val(creds.split("@")[0]);
		$("#org").val(creds.split("@")[1]);
		$("#password").val($("#ukcloud_password").val());
		$("#credflash").show()
	});
	
	var gwlist = document.getElementById('gateways');
	gwlist.addEventListener('change', function() {
		if($(this).val() != "Please Select...")
		{
			clear_vshielddata();
			$("#actiondiv").hide();
			console.log("Noticed a change, firing function");
			get_edge_config($(this).val());
		}
	});
	
	
	var iscustomer = document.getElementById('is_customer');
	iscustomer.addEventListener('change', function() {
		console.log($(this));
		if($(this).prop("checked"))
		{
			$("#ukcloudcreds").show();
			$("#ukcloud_options").hide();
		}
		else
		{
			$("#ukcloudcreds").hide();
			$("#ukcloud_options").hide();
		}
	});
	
	refresh_tasks_btn
	var refresh_tasks_btn = document.getElementById('refresh_tasks_btn');
	refresh_tasks_btn.addEventListener('click', function() {
        console.log("Refresh Tasks Clicked");
		refresh_tasks();
    });
	var postback = document.getElementById('postback');
	postback.addEventListener('click', function() {
		
        post_back();
    });
	
	var rawxmlbutton = document.getElementById('rawxmlbutton');
	rawxmlbutton.addEventListener('click', function() {
		
        $(".CodeMirror")[0].CodeMirror.refresh();
    });
});
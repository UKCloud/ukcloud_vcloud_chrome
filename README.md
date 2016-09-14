# ukcloud_vcloud_chrome
Chrome Plugin for Managing vCloud Director Edge Gateways

I’ve come up with various scripts and modules to interfacing with vCloud, but got fed up with them not necessarily being cross platform, or non-techie friendly. So I’ve been looking at Chrome Apps as it seems like a good way to create cross platform tooling with GUI’s…. Chrome App’s are pretty cool, if you can write HTML/JS/Jquery app’s it’s very quick, gets you around CRS issues and provides a load of local storage API’s etc. 

So, I’ve built a basic App that interfaces with vCloud to allow you to edit the config of vShields. In the short term, I’ll probably add something to allow you to change VM NIC’s to VMXNET3.

To use it – It looks complicated, but it’s literally drag and drop a file into Chrome!
•	In Chrome go to Settings -> Extensions
•	Drag and drop the CRX file from the Dist folder into the Extensions tab and wait a few seconds
•	Accept to install
•	You’ll then get a new Chrome App installed
•	Open a new tab and browse to – “chrome://apps/”
•	You’ll see a logo like a cloud...

To use it – I like to think it’s pretty self explanatory as it flows through, but this is a blow by blow explanation….

•	Check the “Are You a UK Cloud Customer” check box <- I thought this was quite cool as it saves trying to work out what your vCloud creds are
•	Enter your portal username and password
•	Click Get UKCloud API Credentials
•	It’ll then list your available accounts and services
•	Select a service – This will populate the credentials section below with the relevant details
•	Enter the API URL – typically https://vcd.portal.skyscapecloud.com/api/ but obviously this is different for PV2
•	Click Login
•	Check the login status box in the top right – If ok, move to next step

•	A vShield menu item will appear – Click it
•	Click “Get Organisations” – This will get all vCloud Orgs that you have access to with this account
•	Select the relevant Org from the dropdown
•	This will populate the Virtual Datacenters drop down
•	Select the relevant VDC
•	This will populate the vShield Edge Gateways section
•	Select a Gateway

•	This will now populate a few tables in the tabs below for viewing data, however, the Raw XML tab is editable.
•	A button in the top right of the window will also appear labelled “Update Config for vShield Edge”
•	You can make any edits you like to the Raw XML and then click the above button
•	Once you click it, go to the Tasks menu item
•	You can then click “Refresh Tasks” To get an updated status.

